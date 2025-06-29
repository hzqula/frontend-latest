import { FC } from "react";

interface StepperProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

const Stepper: FC<StepperProps> = ({ steps, currentStep, className }) => {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div
            key={index}
            className="flex flex-col items-center relative flex-1"
          >
            {/* Step Circle */}
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 z-10 ${
                currentStep > index + 1
                  ? "bg-green-500 text-white shadow-lg"
                  : currentStep === index + 1
                  ? "bg-env-base text-white shadow-lg ring-4 ring-env-base/50"
                  : "bg-env-lighter text-env-darker border-2 border-env-lighter/50"
              }`}
            >
              {currentStep > index + 1 ? (
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                index + 1
              )}
            </div>

            {/* Step Label */}
            <div
              className={`mt-3 text-center px-2 transition-colors duration-300 ${
                currentStep >= index + 1
                  ? "text-env-darker gray-900 font-bold"
                  : "text-gray-500 font-normal"
              }`}
            >
              <div className="text-sm leading-tight">{step}</div>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="absolute top-5 left-1/2 w-full h-0.5 -z-10">
                <div
                  className={`h-full transition-all duration-500 ${
                    currentStep > index + 1 ? "bg-green-500" : "bg-gray-300"
                  }`}
                  style={{
                    width: "calc(100% - 2.5rem)",
                    marginLeft: "1.25rem",
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
export default Stepper;
