import { Label, Textarea } from '@/components/ui';

interface InstructionsSettingsTabProps {
  instructions: string;
  onInstructionsChange: (value: string) => void;
}

export const InstructionsSettingsTab: React.FC<InstructionsSettingsTabProps> = ({
  instructions,
  onInstructionsChange,
}) => (
  <div className="space-y-6">
    <div>
      <h2 className="mb-4 text-sm font-medium text-text-primary dark:text-text-dark-primary">
        Custom Instructions
      </h2>
      <div className="space-y-4">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label className="text-sm text-text-primary dark:text-text-dark-primary">
              Instructions for the AI assistant
            </Label>
            <span className="text-xs text-text-tertiary dark:text-text-dark-tertiary">
              {instructions.length}/1500
            </span>
          </div>
          <Textarea
            value={instructions}
            onChange={(e) => onInstructionsChange(e.target.value)}
            placeholder="Enter custom instructions for how the AI should behave, respond, or approach tasks..."
            maxLength={1500}
            rows={8}
            className="min-h-32"
          />
          <p className="mt-2 text-xs text-text-tertiary dark:text-text-dark-tertiary">
            These instructions will be added to every conversation with the AI. Use them to specify
            your preferences for communication style, response format, or specific behaviors.
          </p>
        </div>
      </div>
    </div>
  </div>
);
