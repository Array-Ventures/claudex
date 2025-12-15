import { Image, FileText, FileSpreadsheet, Upload } from 'lucide-react';

export interface DropIndicatorProps {
  visible: boolean;
  fileType?: 'image' | 'pdf' | 'xlsx' | 'any';
  message?: string;
  className?: string;
}

interface IconWrapperProps {
  children: React.ReactNode;
}

const IconWrapper = ({ children }: IconWrapperProps) => (
  <div className="relative">
    <div className="absolute inset-0 animate-pulse rounded-full bg-brand-400/30 blur-xl dark:bg-brand-500/30"></div>
    <div className="relative rounded-full bg-surface p-2.5 shadow-medium dark:bg-surface-dark">
      {children}
    </div>
  </div>
);

export function DropIndicator({
  visible,
  fileType = 'image',
  message = 'Drop image here',
  className = '',
}: DropIndicatorProps) {
  if (!visible) return null;

  return (
    <div
      className={`absolute inset-0 z-10 flex animate-fade-in items-center justify-center rounded-2xl bg-brand-50/80 backdrop-blur-sm transition-all duration-200 dark:bg-brand-950/40 ${className}`}
    >
      <div className="flex flex-col items-center gap-2 p-3 text-brand-700 dark:text-brand-300">
        <IconWrapper>
          {fileType === 'image' ? (
            <Image className="h-5 w-5" />
          ) : fileType === 'pdf' ? (
            <FileText className="h-5 w-5" />
          ) : fileType === 'xlsx' ? (
            <FileSpreadsheet className="h-5 w-5" />
          ) : (
            <Upload className="h-5 w-5" />
          )}
        </IconWrapper>
        <p className="text-sm font-semibold">{message}</p>
        <div className="max-w-xs text-center text-xs font-medium text-brand-600 dark:text-brand-400">
          {fileType === 'image'
            ? 'PNG • JPEG • GIF • WebP'
            : fileType === 'pdf'
              ? 'PDF documents'
              : fileType === 'xlsx'
                ? 'Excel documents'
                : 'Release to upload'}
        </div>
      </div>
    </div>
  );
}
