import SectionHeader from './SectionHeader'
import { EmptyState, InputField, SelectField, TextAreaField } from './ui'
import { importantDateTypes, subjectOptions } from '../data/sampleData'
import { classNames, formatDate } from '../lib/helpers'

const categoryOptions = ['Assignment', 'Important Date']
const confidenceStyles = {
  high: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  medium: 'bg-amber-50 text-amber-700 ring-amber-200',
  low: 'bg-slate-100 text-slate-600 ring-slate-200',
  manual: 'bg-sky-50 text-sky-700 ring-sky-200',
}

function WeeklyImportView({
  children,
  upload,
  uploadDate,
  selectedFileName,
  summary,
  suggestions,
  suggestionBuckets,
  preview,
  step,
  onUploadChange,
  onFileChange,
  onAnalyze,
  onSuggestionChange,
  onAddSuggestion,
  onPromoteUnmatched,
  onRemoveSuggestion,
  onGoToReview,
  onBackToExtract,
  onImport,
  onImportAndPlan,
}) {
  const childNameById = children.reduce((lookup, child) => {
    lookup[child.id] = child.name
    return lookup
  }, {})
  const safeSuggestions = suggestions ?? []
  const safeBuckets = suggestionBuckets ?? { assignments: [], importantDates: [], unmatchedLines: [] }
  const safePreview = {
    assignments: preview?.assignments ?? preview?.assignmentsToAdd ?? [],
    importantDates: preview?.importantDates ?? preview?.importantDatesToAdd ?? [],
    plannerTasks: preview?.plannerTasks ?? [],
  }

  const currentStepIndex = step === 'upload' ? 0 : step === 'extract' ? 1 : 2

  return (
    <section className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-soft backdrop-blur">
      <SectionHeader
        title="Weekly Import"
        description="Upload a weekly teacher file, pull out the key school items, and turn them into a clear plan."
      />

      <ImportStepHeader currentStepIndex={currentStepIndex} />

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[0.95fr,1.05fr]">
        <div className="space-y-6">
          <ImportUploadPanel
            children={children}
            upload={upload}
            uploadDate={uploadDate}
            selectedFileName={selectedFileName}
            onUploadChange={onUploadChange}
            onFileChange={onFileChange}
            onAnalyze={onAnalyze}
          />

          <ImportHelperPanel upload={upload} summary={summary} onUploadChange={onUploadChange} />
        </div>

        <div className="space-y-6">
          {step === 'upload' ? (
            <EmptyState
              title="Start with this week’s file"
              description="Upload the teacher file first, then review the suggested school items before importing them into School Hub."
            />
          ) : null}

          {step === 'extract' ? (
            <>
              <SuggestionBucket
                title="Suggested Assignments"
                description="These look like schoolwork items. Review them before import."
                items={safeBuckets.assignments}
                emptyTitle="No assignment suggestions yet"
                emptyDescription="You can still add an assignment manually or move an unmatched line into this list."
                onAdd={() => onAddSuggestion('Assignment')}
                addLabel="Add assignment"
              >
                {safeBuckets.assignments.map((suggestion, index) => (
                  <SuggestionEditorCard
                    key={suggestion.id}
                    suggestion={suggestion}
                    index={index}
                    children={children}
                    onChange={onSuggestionChange}
                    onRemove={onRemoveSuggestion}
                  />
                ))}
              </SuggestionBucket>

              <SuggestionBucket
                title="Suggested Important Dates"
                description="Quizzes, tests, events, and reminders live here."
                items={safeBuckets.importantDates}
                emptyTitle="No important date suggestions yet"
                emptyDescription="Add an important date manually if the teacher file needs one."
                onAdd={() => onAddSuggestion('Important Date')}
                addLabel="Add important date"
              >
                {safeBuckets.importantDates.map((suggestion, index) => (
                  <SuggestionEditorCard
                    key={suggestion.id}
                    suggestion={suggestion}
                    index={index}
                    children={children}
                    onChange={onSuggestionChange}
                    onRemove={onRemoveSuggestion}
                  />
                ))}
              </SuggestionBucket>

              <UnmatchedSuggestionBucket
                items={safeBuckets.unmatchedLines}
                children={children}
                onChange={onSuggestionChange}
                onRemove={onRemoveSuggestion}
                onPromote={onPromoteUnmatched}
              />

              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-display text-2xl text-ink">Ready to review?</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      We&apos;ll show you exactly what will be imported and how the planner can be updated.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onGoToReview}
                    className="rounded-2xl bg-ink px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
                  >
                    Review Import
                  </button>
                </div>
              </div>
            </>
          ) : null}

          {step === 'review' ? (
            <ImportReviewPanel
              childNameById={childNameById}
              upload={upload}
              selectedFileName={selectedFileName}
              preview={safePreview}
              onBack={onBackToExtract}
              onImport={onImport}
              onImportAndPlan={onImportAndPlan}
            />
          ) : null}
        </div>
      </div>
    </section>
  )
}

function ImportStepHeader({ currentStepIndex }) {
  const steps = ['Upload', 'Extract / Enter', 'Review', 'Import']

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {steps.map((label, index) => {
        const isActive = index === currentStepIndex || (index === 3 && currentStepIndex === 2)
        const isComplete = index < currentStepIndex

        return (
          <div
            key={label}
            className={classNames(
              'rounded-[1.5rem] border px-4 py-3',
              isActive
                ? 'border-ink bg-slate-50'
                : isComplete
                  ? 'border-emerald-200 bg-emerald-50'
                  : 'border-slate-200 bg-white',
            )}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Step {index + 1}</p>
            <p className="mt-1 font-semibold text-ink">{label}</p>
          </div>
        )
      })}
    </div>
  )
}

function ImportUploadPanel({
  children,
  upload,
  uploadDate,
  selectedFileName,
  onUploadChange,
  onFileChange,
  onAnalyze,
}) {
  return (
    <div className="rounded-[1.75rem] border border-white/70 bg-canvas p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-2xl text-ink">1. Upload</h3>
          <p className="mt-1 text-sm text-slate-500">
            Add the weekly teacher file, choose the child it belongs to, and give it a quick label so it stays easy to find later.
          </p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 ring-1 ring-slate-200">
          Guided
        </span>
      </div>

      <div className="mt-5 grid gap-4">
        <label className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white px-5 py-6 text-center transition hover:border-plum/40 hover:bg-slate-50">
          <span className="block font-medium text-ink">Drop a weekly file here or browse</span>
          <span className="mt-2 block text-sm text-slate-500">PDF, PNG, JPG, or JPEG</span>
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,image/*"
            onChange={(event) => onFileChange(event.currentTarget.files?.[0] ?? null)}
            className="sr-only"
          />
        </label>

        {selectedFileName ? (
          <div className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4">
            <p className="font-medium text-ink">{selectedFileName}</p>
            <p className="mt-1 text-sm text-slate-500">
              Uploaded {uploadDate ? formatDate(uploadDate.slice(0, 10)) : 'today'}
            </p>
          </div>
        ) : null}

        <div className="grid gap-3 md:grid-cols-2">
          <SelectField label="Child" value={upload.childId} onChange={(value) => onUploadChange('childId', value)}>
            {children.map((child) => (
              <option key={child.id} value={child.id}>
                {child.name}
              </option>
            ))}
          </SelectField>
          <InputField
            label="Week of"
            type="date"
            value={upload.weekOf}
            onChange={(value) => onUploadChange('weekOf', value)}
            helper="Use Monday if you can"
          />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <InputField
            label="Teacher"
            value={upload.teacher}
            onChange={(value) => onUploadChange('teacher', value)}
            placeholder="Teacher name"
          />
          <InputField
            label="Notes"
            value={upload.notes}
            onChange={(value) => onUploadChange('notes', value)}
            placeholder="Teacher weekly newsletter"
          />
        </div>

        <button
          type="button"
          onClick={onAnalyze}
          className="rounded-2xl bg-ink px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          Continue to extract
        </button>
      </div>
    </div>
  )
}

function ImportHelperPanel({ upload, summary, onUploadChange }) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
      <h3 className="font-display text-2xl text-ink">2. Extract / Enter</h3>
      <p className="mt-1 text-sm text-slate-500">
        Extracted PDF text powers suggestions only. Review each row before importing anything into your week.
      </p>

      <div className="mt-4">
        <TextAreaField
          label="Extracted text / notes from file"
          value={upload.extractedText}
          onChange={(value) => onUploadChange('extractedText', value)}
          rows={5}
          placeholder="Paste or adjust any visible text from the teacher file. Suggestions update from this review text, but you stay in control."
        />
      </div>

      {summary.statusMessage ? (
        <div
          className={classNames(
            'mt-4 rounded-[1.25rem] px-4 py-3 text-sm',
            summary.extractionStatus === 'success'
              ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border border-amber-200 bg-amber-50 text-amber-800',
          )}
        >
          {summary.statusMessage}
        </div>
      ) : null}

      {upload.extractedText ? (
        <details className="mt-4 rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3">
          <summary className="cursor-pointer text-sm font-semibold text-ink">Extracted text preview</summary>
          <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap text-sm leading-6 text-slate-600">
            {upload.extractedText}
          </pre>
        </details>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {summary.suggestionChips?.length ? (
          summary.suggestionChips.map((chip) => (
            <span key={chip} className="rounded-full bg-plum/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-plum">
              {chip}
            </span>
          ))
        ) : (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
            Suggestion chips will appear here if date-like text or quiz/test words are detected.
          </span>
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MiniInfo label="Suggested Assignments" value={summary.suggestedAssignments ?? 0} />
        <MiniInfo label="Important Dates" value={summary.suggestedImportantDates ?? 0} />
        <MiniInfo label="Needs Review" value={summary.unmatchedLines ?? 0} />
        <MiniInfo label="Date-like Strings" value={summary.detectedDates ?? 0} />
      </div>
    </div>
  )
}

function SuggestionBucket({ title, description, items, emptyTitle, emptyDescription, onAdd, addLabel, children }) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-2xl text-ink">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="rounded-2xl bg-white px-4 py-2 text-sm font-medium text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50"
        >
          {addLabel}
        </button>
      </div>

      <div className="space-y-4">
        {items.length === 0 ? <EmptyState title={emptyTitle} description={emptyDescription} /> : children}
      </div>
    </div>
  )
}

function SuggestionEditorCard({ suggestion, index, children, onChange, onRemove }) {
  const isImportantDate = suggestion.category === 'Important Date'

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Suggestion {index + 1}</p>
          <ConfidenceBadge confidence={suggestion.confidence} />
        </div>
        <button
          type="button"
          onClick={() => onRemove(suggestion.id)}
          className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
        >
          Remove
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <SelectField label="Child" value={suggestion.childId} onChange={(value) => onChange(suggestion.id, 'childId', value)}>
          {children.map((child) => (
            <option key={child.id} value={child.id}>
              {child.name}
            </option>
          ))}
        </SelectField>
        <SelectField label="Category" value={suggestion.category} onChange={(value) => onChange(suggestion.id, 'category', value)}>
          {categoryOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </SelectField>
        <InputField
          label={isImportantDate ? 'Date' : 'Due date'}
          type="date"
          value={suggestion.date}
          onChange={(value) => onChange(suggestion.id, 'date', value)}
        />
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <SelectField label="Subject" value={suggestion.subject} onChange={(value) => onChange(suggestion.id, 'subject', value)}>
          {subjectOptions.map((subject) => (
            <option key={subject} value={subject}>
              {subject}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Type"
          value={suggestion.type}
          onChange={(value) => onChange(suggestion.id, 'type', value)}
          disabled={!isImportantDate}
        >
          {!isImportantDate ? <option value="">Not needed for assignments</option> : null}
          {isImportantDate ? <option value="">Select type</option> : null}
          {importantDateTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </SelectField>
      </div>

      <div className="mt-3">
        <InputField
          label="Title"
          value={suggestion.title}
          onChange={(value) => onChange(suggestion.id, 'title', value)}
          placeholder="Suggested item title"
        />
      </div>

      <div className="mt-3">
        <TextAreaField
          label="Notes"
          value={suggestion.notes}
          onChange={(value) => onChange(suggestion.id, 'notes', value)}
          rows={3}
          placeholder="Optional reminder or context from the teacher file"
        />
      </div>

      {suggestion.sourceLine ? (
        <div className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-500">
          <p className="font-medium text-slate-600">Source line</p>
          <p className="mt-1">{suggestion.sourceLine}</p>
        </div>
      ) : null}
    </div>
  )
}

function UnmatchedSuggestionBucket({ items, children, onChange, onRemove, onPromote }) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
      <div className="mb-4">
        <h3 className="font-display text-2xl text-ink">Unmatched Lines / Needs Review</h3>
        <p className="mt-1 text-sm text-slate-500">
          These lines may still be useful. Turn them into an assignment or important date if they belong in the week.
        </p>
      </div>

      <div className="space-y-4">
        {items.length === 0 ? (
          <EmptyState
            title="No extra review lines"
            description="Anything that looked uncertain would appear here so you can decide whether it belongs in the week."
          />
        ) : (
          items.map((suggestion, index) => (
            <div key={suggestion.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Needs review {index + 1}</p>
                  <ConfidenceBadge confidence={suggestion.confidence} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onPromote(suggestion.id, 'Assignment')}
                    className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50"
                  >
                    Make assignment
                  </button>
                  <button
                    type="button"
                    onClick={() => onPromote(suggestion.id, 'Important Date')}
                    className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50"
                  >
                    Make important date
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemove(suggestion.id)}
                    className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <SelectField label="Child" value={suggestion.childId} onChange={(value) => onChange(suggestion.id, 'childId', value)}>
                  {children.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.name}
                    </option>
                  ))}
                </SelectField>
                <SelectField label="Subject" value={suggestion.subject} onChange={(value) => onChange(suggestion.id, 'subject', value)}>
                  {subjectOptions.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </SelectField>
              </div>

              <div className="mt-3">
                <InputField
                  label="Line to review"
                  value={suggestion.title}
                  onChange={(value) => onChange(suggestion.id, 'title', value)}
                  placeholder="Keep this line as a note or promote it into a structured item"
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function ImportReviewPanel({ childNameById, upload, selectedFileName, preview, onBack, onImport, onImportAndPlan }) {
  const hasAnythingToReview =
    (preview.assignments?.length ?? 0) > 0 ||
    (preview.importantDates?.length ?? 0) > 0 ||
    (preview.plannerTasks?.length ?? 0) > 0

  return (
    <>
      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="font-display text-2xl text-ink">Review</h3>
            <p className="mt-1 text-sm text-slate-500">
              Check the imported school items first, then choose whether to keep the planner as-is or refresh the auto-generated weekly plan.
            </p>
          </div>
          <div className="rounded-[1.25rem] bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <p className="font-medium text-ink">{selectedFileName || 'No file selected'}</p>
            <p className="mt-1">{childNameById[upload.childId] || 'Child not selected'} · Week of {formatDate(upload.weekOf)}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MiniInfo label="Assignments" value={preview.assignments.length} large />
        <MiniInfo label="Important Dates" value={preview.importantDates.length} large />
        <MiniInfo label="Planner Preview" value={preview.plannerTasks.length} large />
      </div>

      {!hasAnythingToReview ? (
        <EmptyState
          title="Nothing ready to review yet"
          description="Go back to the extract step, add at least one assignment or important date, and then review the import again."
        />
      ) : null}

      <div className="grid gap-4 xl:grid-cols-3">
        <ImportReviewCard
          title="Assignments"
          subtitle="New schoolwork that will be added."
          items={preview.assignments}
          renderItem={(item) => (
            <>
              <p className="font-medium text-ink">{item.title}</p>
              <p className="mt-1 text-sm text-slate-500">
                {childNameById[item.childId]} · {item.subject} · Due {formatDate(item.dueDate)}
              </p>
            </>
          )}
        />
        <ImportReviewCard
          title="Important Dates"
          subtitle="Quizzes, tests, projects, and reminders."
          items={preview.importantDates}
          renderItem={(item) => (
            <>
              <p className="font-medium text-ink">{item.title}</p>
              <p className="mt-1 text-sm text-slate-500">
                {childNameById[item.childId]} · {item.type} · {formatDate(item.date)}
              </p>
            </>
          )}
        />
        <ImportReviewCard
          title="Planner Preview"
          subtitle="Generated study blocks if you refresh the plan."
          items={preview.plannerTasks}
          renderItem={(item) => (
            <>
              <p className="font-medium text-ink">{item.title}</p>
              <p className="mt-1 text-sm text-slate-500">
                {item.day} · {childNameById[item.childId]} · {item.subject}
              </p>
            </>
          )}
        />
      </div>

      <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
        <p className="text-sm font-medium text-ink">Manual planner tasks are kept. Imported school items are added to this week.</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={onBack}
            className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50"
          >
            Back to Extract
          </button>
          <button
            type="button"
            onClick={onImport}
            disabled={!hasAnythingToReview}
            className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
          >
            Import Week
          </button>
          <button
            type="button"
            onClick={onImportAndPlan}
            disabled={!hasAnythingToReview}
            className="rounded-2xl bg-ink px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Import and Regenerate Plan
          </button>
        </div>
      </div>
    </>
  )
}

function ImportReviewCard({ title, subtitle, items, renderItem }) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
      <h4 className="font-display text-xl text-ink">{title}</h4>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <EmptyState title={`No ${title.toLowerCase()} yet`} description="Go back and add details before importing this week." />
        ) : (
          items.map((item, index) => (
            <div key={item.id ?? `${title}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              {renderItem(item)}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function ConfidenceBadge({ confidence }) {
  return (
    <span
      className={classNames(
        'rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ring-1',
        confidenceStyles[confidence] ?? confidenceStyles.low,
      )}
    >
      {confidence === 'manual' ? 'Manual' : `${confidence} confidence`}
    </span>
  )
}

function MiniInfo({ label, value, large = false }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className={classNames('mt-2 font-display text-2xl text-ink', large && 'text-3xl')}>{value}</p>
    </div>
  )
}

export default WeeklyImportView
