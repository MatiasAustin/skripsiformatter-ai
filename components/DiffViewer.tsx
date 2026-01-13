import React, { useMemo } from 'react';
import * as Diff from 'diff';

interface DiffViewerProps {
    original: string;
    modified: string;
}

const DiffViewer: React.FC<DiffViewerProps> = ({ original, modified }) => {
    const diff = useMemo(() => {
        return Diff.diffWords(original, modified);
    }, [original, modified]);

    return (
        <div className="academic-font text-lg leading-[1.8] text-slate-700 max-h-[500px] overflow-y-auto pr-4 whitespace-pre-wrap">
            {diff.map((part, index) => {
                const color = part.added
                    ? 'bg-emerald-200/50 text-emerald-800'
                    : part.removed
                        ? 'bg-rose-200/50 text-rose-800 line-through decoration-rose-500'
                        : 'text-slate-700';

                return (
                    <span key={index} className={`${color} px-0.5 rounded-sm transition-colors duration-300`}>
                        {part.value}
                    </span>
                );
            })}
        </div>
    );
};

export default DiffViewer;
