import React, { useEffect, useState } from 'react';

interface AppInfoModalProps {
  onClose: () => void;
}

export const AppInfoModal: React.FC<AppInfoModalProps> = ({ onClose }) => {
    const [version, setVersion] = useState('...');

    useEffect(() => {
        const fetchVersion = async () => {
            try {
                // Prepend the base URL to correctly locate version.json in both dev and prod.
                // FIX: Cast `import.meta` to `any` to access Vite's `env` properties which are not in the default TS types.
                const response = await fetch(`${(import.meta as any).env.BASE_URL}/version.json`);
                if (response.ok) {
                    const data = await response.json();
                    setVersion(data.version || 'N/A');
                } else {
                    setVersion('N/A');
                }
            } catch (error) {
                console.error('Failed to fetch version:', error);
                setVersion('N/A');
            }
        };

        fetchVersion();

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    return (
        <div 
            className="fixed inset-0 bg-black/80 z-50 flex justify-center items-center p-4 transition-opacity"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-[#212934] border-2 border-sky-500/50 shadow-sky-500/20 shadow-2xl rounded-xl w-full max-w-md max-h-[90vh] flex flex-col relative overflow-hidden"
                onClick={(e) => e.stopPropagation()}
                style={{
                    backgroundImage: 'radial-gradient(circle at top, rgba(0, 32, 91, 0.4), transparent 60%)',
                }}
            >
                {/* Header */}
                <div className="p-4 border-b-2 border-sky-500/30 flex justify-between items-center shrink-0 bg-black/20">
                    <h2 
                        className="text-xl font-black tracking-wide text-white"
                        style={{ textShadow: '0 0 5px rgba(0,0,0,0.8)' }}
                    >
                        About NHL '94 Lineup Editor
                    </h2>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto text-gray-300 space-y-4">
                    <p>
                        This application allows you to edit the team lineups for any NHL '94 rom. 
                    </p>
                    <p>
                        Drag and drop players between the lineup and the roster, view player attributes, and save your changes back to a new ROM file.
                    </p>
                    <p>
                        All changes are tracked, and you can undo them via the history panel. You can also export changes to Excel.
                    </p>
                    <p>
                        Enjoy, any feedback is welcome.
                    </p>
                     <p>
                        v {version}
                    </p>
                </div>

                 <button 
                    onClick={onClose} 
                    className="absolute top-2 right-2 text-gray-400 hover:text-white text-2xl font-bold bg-black/20 rounded-full w-7 h-7 flex items-center justify-center"
                    aria-label="Close"
                >
                    &times;
                </button>
            </div>
        </div>
    );
};