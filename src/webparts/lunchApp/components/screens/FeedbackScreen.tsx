import * as React from 'react';
import { ILunchRequest } from '../../../../common/Interfaces';
import styles from './FeedbackScreen.module.scss';

interface IFeedbackScreenProps {
  feedbackText: string;
  isSaving: boolean;
  errorMessage: string;
  todayRequest: ILunchRequest | undefined;
  onFeedbackChange: (value: string) => void;
  onSubmit: () => void;
  onBack: () => void;
}

const FeedbackScreen: React.FC<IFeedbackScreenProps> = ({
  feedbackText,
  isSaving,
  errorMessage,
  todayRequest,
  onFeedbackChange,
  onSubmit,
  onBack,
}) => {
  const hasExistingFeedback = !!(todayRequest?.Comments?.trim());
  const canSubmit = feedbackText.trim().length > 0 && !isSaving;

  const formatDate = (dateStr: string): string =>
    new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    });

  return (
    <div className={styles.container}>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack} aria-label="Go back">
          &#8592;
        </button>
        <span className={styles.headerTitle}>Lunch Feedback</span>
        <span className={styles.headerSpace} />
      </div>

      {/* ── Content ─────────────────────────────────────────────────── */}
      <div className={styles.content}>

        {/* Hero */}
        <div className={styles.hero}>
          <div className={styles.heroIcon}>&#128172;</div>
          <h2 className={styles.heroTitle}>Share Your Feedback</h2>
          <p className={styles.heroSubtitle}>
            Tell us about today&apos;s lunch experience. Your feedback helps us improve!
          </p>
        </div>

        {/* Today's request chip */}
        {todayRequest && (
          <div className={styles.requestChip}>
            <span className={styles.chipBadge}>{todayRequest.Title}</span>
            <span className={styles.chipDate}>{formatDate(todayRequest.RequestedDate)}</span>
          </div>
        )}

        {/* Previous feedback */}
        {hasExistingFeedback && (
          <div className={styles.existingCard}>
            <div className={styles.existingLabel}>&#128196;&nbsp;Previous Feedback</div>
            <p className={styles.existingText}>{todayRequest!.Comments}</p>
          </div>
        )}

        {/* Textarea */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="feedbackArea">
            Your Comments
          </label>
          <textarea
            id="feedbackArea"
            className={styles.textarea}
            value={feedbackText}
            onChange={e => onFeedbackChange(e.target.value)}
            placeholder="How was today's lunch? Share your experience, suggestions, or compliments for the kitchen team…"
            rows={6}
            disabled={isSaving}
            aria-label="Feedback text"
          />
          <div className={styles.charCount}>{feedbackText.length} character{feedbackText.length !== 1 ? 's' : ''}</div>
        </div>

        {/* Error */}
        {errorMessage && (
          <div className={styles.errorMsg}>
            <span>&#10060;</span>&nbsp;{errorMessage}
          </div>
        )}

        {/* Buttons */}
        <div className={styles.buttonGroup}>
          <button className={styles.cancelBtn} onClick={onBack} disabled={isSaving}>
            Cancel
          </button>
          <button
            className={`${styles.submitBtn}${!canSubmit ? ` ${styles.submitBtnDisabled}` : ''}`}
            onClick={onSubmit}
            disabled={!canSubmit}
            aria-label="Submit feedback"
          >
            {isSaving ? (
              <>
                <span className={styles.btnSpinner} />
                Saving…
              </>
            ) : (
              <>&#128140;&nbsp;Submit Feedback</>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default FeedbackScreen;
