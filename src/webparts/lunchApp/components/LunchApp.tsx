import * as React from 'react';
import { ILunchAppProps } from './ILunchAppProps';
import { ILunchAppState } from './ILunchAppState';
import { ILunchRequest } from '../../../common/Interfaces';
import { TIME_CONFIG } from '../../../common/Constants';
import { SharePointService } from '../../../services/SharePointService';
import { GraphService } from '../../../services/GraphService';
import HomeScreen from './screens/HomeScreen';
import FeedbackScreen from './screens/FeedbackScreen';
import styles from './LunchApp.module.scss';

export default class LunchApp extends React.Component<ILunchAppProps, ILunchAppState> {
  private spService: SharePointService;
  private graphService: GraphService;

  constructor(props: ILunchAppProps) {
    super(props);
    this.spService = new SharePointService(props.context);
    this.graphService = new GraphService(props.context);
    this.state = {
      screen: 'home',
      isLoading: true,
      isSubmitting: false,
      isDeleting: false,
      isSavingFeedback: false,
      lunchRequests: [],
      hrPerson: undefined,
      currentUser: undefined,
      errorMessage: '',
      successMessage: '',
      deleteConfirmId: undefined,
      feedbackText: '',
    };
  }

  public async componentDidMount(): Promise<void> {
    await this.loadData();
  }

  // ── Data loading ────────────────────────────────────────────────────────────

  private async loadData(): Promise<void> {
    try {
      this.setState({ isLoading: true, errorMessage: '' });
      const [currentUser, hrPerson] = await Promise.all([
        this.spService.getCurrentUser(),
        this.spService.getHRPerson(),
      ]);
      const requests = await this.spService.getLunchRequests(currentUser.email);
      this.setState({ currentUser, hrPerson, lunchRequests: requests, isLoading: false });
    } catch (err) {
      this.setState({ isLoading: false, errorMessage: `Failed to load: ${(err as Error).message}` });
    }
  }

  // ── Business logic helpers ───────────────────────────────────────────────────

  private getTargetDate(): Date {
    const now = new Date();
    const hour = now.getHours();
    const target = new Date(now);
    target.setHours(0, 0, 0, 0);
    if (hour >= TIME_CONFIG.SUBMIT_START_HOUR) {
      target.setDate(target.getDate() + 1);
    }
    return target;
  }

  private isSubmitEnabled(): boolean {
    const hour = new Date().getHours();
    // Disabled in the "dead zone" between 12:00 PM and 4:00 PM
    if (hour >= TIME_CONFIG.SUBMIT_END_HOUR && hour < TIME_CONFIG.SUBMIT_START_HOUR) {
      return false;
    }
    const targetDate = this.getTargetDate();
    return !this.state.lunchRequests.some(req => {
      const d = new Date(req.RequestedDate);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === targetDate.getTime();
    });
  }

  private isFeedbackEnabled(): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.state.lunchRequests.some(req => {
      const d = new Date(req.RequestedDate);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    });
  }

  private getTodayRequest(): ILunchRequest | undefined {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.state.lunchRequests.find(req => {
      const d = new Date(req.RequestedDate);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    });
  }

  private canDeleteItem = (item: ILunchRequest): boolean => {
    const diffHours = (Date.now() - new Date(item.Created).getTime()) / 3600000;
    return diffHours <= TIME_CONFIG.DELETE_WITHIN_HOURS;
  };

  private getCurrentMonthRequests(): ILunchRequest[] {
    const now = new Date();
    return this.state.lunchRequests.filter(req => {
      const d = new Date(req.RequestedDate);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
  }

  // ── Action handlers ──────────────────────────────────────────────────────────

  private handleSubmit = async (): Promise<void> => {
    const { currentUser, hrPerson } = this.state;
    if (!currentUser) {
      this.setState({ errorMessage: 'Could not identify current user. Please refresh the page.' });
      return;
    }

    try {
      this.setState({ isSubmitting: true, errorMessage: '', successMessage: '' });
      const targetDate = this.getTargetDate();

      // Resolve HR SharePoint user ID — optional, record is created even if HR lookup failed.
      let hrSpId: number | undefined;
      if (hrPerson?.EMail) {
        try {
          hrSpId = hrPerson.Id ?? (await this.spService.ensureUser(hrPerson.EMail));
        } catch {
          // HR ID resolution failed — continue without HR Name field
        }
      }

      // Create item in Lunch Request list
      const newId = await this.spService.submitLunchRequest(
        currentUser.spUserId,
        targetDate,
        hrSpId
      );

      // Patch Request# and Indexed_ID
      await this.spService.updateRequestMeta(newId);

      const requestNum = `LUR${('00000' + newId).slice(-5)}`;

      // Send confirmation email (non-blocking — failure doesn't abort submit)
      this.graphService
        .sendConfirmationEmail(
          currentUser.email,
          currentUser.displayName,
          requestNum,
          targetDate,
          hrPerson?.Title ?? 'HR Team'
        )
        .catch(() => console.warn('Confirmation email could not be sent'));

      const requests = await this.spService.getLunchRequests(currentUser.email);
      this.setState({
        lunchRequests: requests,
        isSubmitting: false,
        successMessage: `Your lunch request ${requestNum} has been submitted successfully!`,
      });
      setTimeout(() => this.setState({ successMessage: '' }), 5000);
    } catch (err) {
      this.setState({
        isSubmitting: false,
        errorMessage: `Submission failed: ${(err as Error).message}`,
      });
    }
  };

  private handleDeleteRequest = (id: number): void => {
    this.setState({ deleteConfirmId: id });
  };

  private handleDeleteConfirm = async (): Promise<void> => {
    const { deleteConfirmId, currentUser, lunchRequests } = this.state;
    if (!deleteConfirmId || !currentUser) return;

    const item = lunchRequests.find(r => r.ID === deleteConfirmId);
    if (!item) return;

    if (!this.canDeleteItem(item)) {
      this.setState({
        deleteConfirmId: undefined,
        errorMessage: 'This request cannot be removed — your lunch time has already passed.',
      });
      return;
    }

    try {
      this.setState({ isDeleting: true, deleteConfirmId: undefined });
      await this.spService.deleteLunchRequest(deleteConfirmId);
      const requests = await this.spService.getLunchRequests(currentUser.email);
      this.setState({
        lunchRequests: requests,
        isDeleting: false,
        successMessage: 'Lunch request deleted successfully.',
      });
      setTimeout(() => this.setState({ successMessage: '' }), 3000);
    } catch (err) {
      this.setState({
        isDeleting: false,
        errorMessage: `Delete failed: ${(err as Error).message}`,
      });
    }
  };

  private handleDeleteCancel = (): void => this.setState({ deleteConfirmId: undefined });

  private handleNavigateToFeedback = (): void =>
    this.setState({ screen: 'feedback', feedbackText: '', errorMessage: '' });

  private handleNavigateHome = (): void =>
    this.setState({ screen: 'home', errorMessage: '' });

  private handleFeedbackChange = (value: string): void =>
    this.setState({ feedbackText: value });

  private handleFeedbackSubmit = async (): Promise<void> => {
    const { feedbackText, currentUser } = this.state;
    const todayRequest = this.getTodayRequest();
    if (!todayRequest || !feedbackText.trim() || !currentUser) return;

    try {
      this.setState({ isSavingFeedback: true, errorMessage: '' });
      await this.spService.saveFeedback(todayRequest.ID, feedbackText.trim());
      const requests = await this.spService.getLunchRequests(currentUser.email);
      this.setState({
        lunchRequests: requests,
        isSavingFeedback: false,
        screen: 'home',
        successMessage: 'Thank you! Your feedback has been submitted.',
      });
      setTimeout(() => this.setState({ successMessage: '' }), 4000);
    } catch (err) {
      this.setState({
        isSavingFeedback: false,
        errorMessage: `Failed to save feedback: ${(err as Error).message}`,
      });
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  public render(): React.ReactElement {
    const {
      screen, isLoading, isSubmitting, isDeleting, isSavingFeedback,
      currentUser, errorMessage, successMessage, deleteConfirmId, feedbackText,
    } = this.state;

    if (isLoading) {
      return (
        <div className={styles.loadingWrapper}>
          <div className={styles.spinner} />
          <p className={styles.loadingText}>Loading Lunch App…</p>
        </div>
      );
    }

    if (screen === 'feedback') {
      return (
        <FeedbackScreen
          feedbackText={feedbackText}
          isSaving={isSavingFeedback}
          errorMessage={errorMessage}
          todayRequest={this.getTodayRequest()}
          onFeedbackChange={this.handleFeedbackChange}
          onSubmit={this.handleFeedbackSubmit}
          onBack={this.handleNavigateHome}
        />
      );
    }

    return (
      <HomeScreen
        currentUser={currentUser}
        submitEnabled={this.isSubmitEnabled()}
        feedbackEnabled={this.isFeedbackEnabled()}
        isSubmitting={isSubmitting}
        isDeleting={isDeleting}
        currentMonthRequests={this.getCurrentMonthRequests()}
        targetDate={this.getTargetDate()}
        errorMessage={errorMessage}
        successMessage={successMessage}
        deleteConfirmId={deleteConfirmId}
        onSubmit={this.handleSubmit}
        onDeleteRequest={this.handleDeleteRequest}
        onDeleteConfirm={this.handleDeleteConfirm}
        onDeleteCancel={this.handleDeleteCancel}
        onFeedback={this.handleNavigateToFeedback}
        canDeleteItem={this.canDeleteItem}
      />
    );
  }
}
