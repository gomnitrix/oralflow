import React, { useState } from 'react';

interface TooltipProps {
    content: React.ReactNode;
    children: React.ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top' }) => {
    const [isVisible, setIsVisible] = useState(false);

    const positionClasses = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    };

    return (
        <div
            className="relative flex items-center"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            {isVisible && (
                <div className={`absolute z-50 w-max max-w-xs px-3 py-2 text-xs text-white bg-gray-800 rounded shadow-lg pointer-events-none ${positionClasses[position]}`}>
                    {content}
                    {/* Arrow */}
                    <div
                        className={`absolute w-2 h-2 bg-gray-800 rotate-45 ${position === 'top' ? 'bottom-[-4px] left-1/2 -translate-x-1/2' :
                                position === 'bottom' ? 'top-[-4px] left-1/2 -translate-x-1/2' :
                                    position === 'left' ? 'right-[-4px] top-1/2 -translate-y-1/2' :
                                        'left-[-4px] top-1/2 -translate-y-1/2'
                            }`}
                    />
                </div>
            )}
        </div>
    );
};
