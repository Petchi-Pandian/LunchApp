import { ILunchRequest, IPersonField, ICurrentUser } from '../../../common/Interfaces';
import { ScreenType } from '../../../common/Constants';

export interface ILunchAppState {
  screen: ScreenType;
  isLoading: boolean;
  isSubmitting: boolean;
  isDeleting: boolean;
  isSavingFeedback: boolean;
  lunchRequests: ILunchRequest[];
  hrPerson: IPersonField | undefined;
  currentUser: ICurrentUser | undefined;
  errorMessage: string;
  successMessage: string;
  deleteConfirmId: number | undefined;
  feedbackText: string;
}
