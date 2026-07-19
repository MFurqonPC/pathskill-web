const STEPS = ["Self-Rating", "Self-Assess", "Verification"];

export default function AssessmentStepIndicator({
  currentStep,
}: {
  currentStep: 1 | 2 | 3;
}) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {STEPS.map((label, i) => {
        const step = i + 1;
        const isActive = step === currentStep;
        const isDone = step < currentStep;
        return (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 ${
                isDone
                  ? "bg-green-500 text-white"
                  : isActive
                  ? "bg-blue-600 text-white"
                  : "bg-white/10 text-white/40"
              }`}
            >
              {isDone ? "✓" : step}
            </div>
            <span
              className={`text-[10px] hidden sm:inline ${
                isActive ? "text-white" : "text-white/40"
              }`}
            >
              {label}
            </span>
            {step < 3 && (
              <div
                className={`flex-1 h-0.5 ${
                  isDone ? "bg-green-500" : "bg-white/10"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
