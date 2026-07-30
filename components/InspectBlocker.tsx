'use client';

import { useEffect } from 'react';

export default function InspectBlocker() {
    useEffect(() => {
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.stopImmediatePropagation) e.stopImmediatePropagation();
            return false;
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            const key = (e.key || '').toUpperCase();
            const isF12 = key === 'F12' || e.keyCode === 123;
            const isInspectCombo = (e.ctrlKey || e.metaKey) && (e.shiftKey || e.altKey) && ['I', 'J', 'C', 'K', 'S'].includes(key);
            const isViewSource = (e.ctrlKey || e.metaKey) && key === 'U';

            if (isF12 || isInspectCombo || isViewSource) {
                e.preventDefault();
                e.stopPropagation();
                if (e.stopImmediatePropagation) e.stopImmediatePropagation();
                return false;
            }
        };

        window.addEventListener('contextmenu', handleContextMenu, true);
        document.addEventListener('contextmenu', handleContextMenu, true);
        window.addEventListener('keydown', handleKeyDown, true);
        document.addEventListener('keydown', handleKeyDown, true);

        return () => {
            window.removeEventListener('contextmenu', handleContextMenu, true);
            document.removeEventListener('contextmenu', handleContextMenu, true);
            window.removeEventListener('keydown', handleKeyDown, true);
            document.removeEventListener('keydown', handleKeyDown, true);
        };
    }, []);

    return null;
}
