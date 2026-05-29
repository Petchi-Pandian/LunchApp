import * as React from 'react';
import { ILunchRequest, ICurrentUser } from '../../../../common/Interfaces';
import styles from './HomeScreen.module.scss';

interface IHomeScreenProps {
  currentUser: ICurrentUser | undefined;
  submitEnabled: boolean;
  feedbackEnabled: boolean;
  isSubmitting: boolean;
  isDeleting: boolean;
  currentMonthRequests: ILunchRequest[];
  targetDate: Date;
  errorMessage: string;
  successMessage: string;
  deleteConfirmId: number | undefined;
  onSubmit: () => void;
  onDeleteRequest: (id: number) => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
  onFeedback: () => void;
  canDeleteItem: (item: ILunchRequest) => boolean;
}

const HomeScreen: React.FC<IHomeScreenProps> = ({
  currentUser,
  submitEnabled,
  feedbackEnabled,
  isSubmitting,
  isDeleting,
  currentMonthRequests,
  targetDate,
  errorMessage,
  successMessage,
  deleteConfirmId,
  onSubmit,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
  onFeedback,
  canDeleteItem,
}) => {
  const now = new Date();
  const hour = now.getHours();

  const dayLabel = targetDate.toLocaleDateString('en-US', { weekday: 'long' });
  const dayNum   = targetDate.getDate();
  const monthLabel = targetDate.toLocaleDateString('en-US', { month: 'long' });

  const currentMonthLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const formatDate = (dateStr: string): string =>
    new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });

  const hourStr = (h: number): string =>
    h === 0 ? '12:00 AM' : h < 12 ? `${h}:00 AM` : h === 12 ? '12:00 PM' : `${h - 12}:00 PM`;

  const todayMidnight = new Date(now); todayMidnight.setHours(0, 0, 0, 0);
  const tomorrowMidnight = new Date(todayMidnight); tomorrowMidnight.setDate(tomorrowMidnight.getDate() + 1);
  const windowLabel = targetDate.getTime() === todayMidnight.getTime()
    ? `Submitting for today — deadline 12:00 PM`
    : targetDate.getTime() === tomorrowMidnight.getTime()
      ? 'Submitting for tomorrow'
      : `Submitting for ${dayLabel}`;

  return (
    <div className={styles.wrapper}>
    <div className={styles.container}>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <span className={styles.headerHomeIcon}>&#127968;</span>
        <span className={styles.headerTitle}>Lunch Request App</span>
      </div>

      {/* ── Brand + Welcome ─────────────────────────────────────────── */}
      <div className={styles.brandSection}>
        <div className={styles.brandLogo}>
          <span className={styles.brandVee}>vee</span>
          <span className={styles.brandLead}>lead</span>
        </div>
        <div className={styles.welcomeText}>
          Welcome: <strong>{currentUser?.displayName ?? '—'}</strong>
        </div>
      </div>

      {/* ── Banner ──────────────────────────────────────────────────── */}
      <div className={styles.banner}>
        <div className={styles.bannerLeft}>
          <div className={styles.bannerTitle}>Veelead</div>
          <div className={styles.bannerSubtitle}>Lunch Request App</div>
        </div>
        <span className={styles.bannerEmoji}>&#127835;</span>
      </div>

      {/* ── Time Notice ─────────────────────────────────────────────── */}
      <div className={styles.timeNotice}>
        &#9200; Please submit your lunch request before&nbsp;<strong>12:00 PM</strong>
      </div>

      {/* ── Date Card ───────────────────────────────────────────────── */}
      <div className={styles.dateCard}>
        <span className={styles.dateDecor}>&#127849;</span>
        <div className={styles.dateContent}>
          <span className={styles.dateDayName}>{dayLabel}</span>
          <span className={styles.dateDayNum}>{monthLabel}&nbsp;{dayNum}</span>
        </div>
        <span className={styles.dateDecor}>&#127856;</span>
      </div>

      {/* ── Submit Button ───────────────────────────────────────────── */}
      <div className={styles.submitSection}>
        <button
          className={`${styles.submitBtn}${!submitEnabled || isSubmitting ? ` ${styles.submitBtnDisabled}` : ''}`}
          onClick={onSubmit}
          disabled={!submitEnabled || isSubmitting}
          aria-label="Submit lunch request"
        >
          {isSubmitting ? (
            <>
              <span className={styles.btnSpinner} />
              Submitting…
            </>
          ) : (
            <>
              <span className={styles.btnArrow}>&#8594;</span>
              Submit
            </>
          )}
        </button>
        <div className={styles.submitHint}>
          {submitEnabled
            ? windowLabel
            : `Disabled — available 04:00 PM to 12:00 PM IST (now ${hourStr(hour)})`}
        </div>
      </div>

      {/* ── Stats Row ───────────────────────────────────────────────── */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Availed this month</span>
          <span className={styles.statBadge}>{currentMonthRequests.length}</span>
        </div>
        <button
          className={`${styles.feedbackBtn}${!feedbackEnabled ? ` ${styles.feedbackBtnDisabled}` : ''}`}
          onClick={onFeedback}
          disabled={!feedbackEnabled}
          aria-label="Give feedback"
          title={feedbackEnabled ? 'Share your feedback' : 'Submit a lunch request today to enable feedback'}
        >
          &#128172;&nbsp;Feedback
        </button>
      </div>

      {/* ── Messages ────────────────────────────────────────────────── */}
      {successMessage && (
        <div className={styles.successMsg}>
          <span className={styles.msgIcon}>&#9989;</span>
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className={styles.errorMsg}>
          <span className={styles.msgIcon}>&#10060;</span>
          {errorMessage}
        </div>
      )}

      {/* ── Gallery ─────────────────────────────────────────────────── */}
      <div className={styles.gallerySection}>
        <div className={styles.galleryHeader}>
          <span className={styles.galleryTitle}>&#128203;&nbsp;{currentMonthLabel} Submissions</span>
          <span className={styles.galleryBadge}>{currentMonthRequests.length}</span>
        </div>

        {currentMonthRequests.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>&#127861;</div>
            <p>No submissions this month yet</p>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <div className={`${styles.tableRow} ${styles.tableRowHeader}`}>
              <span>Request #</span>
              <span>Lunch Date</span>
              <span>Action</span>
            </div>
            {currentMonthRequests.map(item => (
              <div key={item.ID} className={styles.tableRow}>
                <span className={styles.reqNumBadge}>
                  {item.Title || `#${item.ID}`}
                </span>
                <span className={styles.reqDate}>
                  {formatDate(item.RequestedDate)}
                </span>
                <span className={styles.actionCell}>
                  {canDeleteItem(item) ? (
                    <button
                      className={styles.deleteBtn}
                      onClick={() => onDeleteRequest(item.ID)}
                      disabled={isDeleting}
                      title="Delete this request"
                      aria-label="Delete request"
                    >
                      &#128465;
                    </button>
                  ) : (
                    <span className={styles.lockedIcon} title="Cannot delete — time window passed">
                      &#128274;
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Delete Confirm Modal ─────────────────────────────────────── */}
      {deleteConfirmId && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <div className={styles.modalIcon}>&#9888;&#65039;</div>
            <h3 className={styles.modalTitle}>Delete Request?</h3>
            <p className={styles.modalBody}>
              Are you sure you want to delete this lunch request?
              This action <strong>cannot be undone</strong>.
            </p>
            <div className={styles.modalActions}>
              <button className={styles.modalCancelBtn} onClick={onDeleteCancel}>
                Cancel
              </button>
              <button className={styles.modalDeleteBtn} onClick={onDeleteConfirm} disabled={isDeleting}>
                {isDeleting ? 'Deleting…' : <><span>&#128465;</span>&nbsp;Delete</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default HomeScreen;
