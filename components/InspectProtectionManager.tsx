'use client';

import { useEffect, useState } from 'react';

interface InspectProtectionManagerProps {
    initialDisableInspect?: boolean;
}

export default function InspectProtectionManager({ initialDisableInspect = true }: InspectProtectionManagerProps) {
    const [enabled, setEnabled] = useState<boolean>(initialDisableInspect);

    useEffect(() => {
        // Fetch current system settings from server API on mount
        const fetchStatus = async () => {
            try {
                const res = await fetch('/api/system-settings', { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();
                    if (typeof data.disableInspect === 'boolean') {
                        setEnabled(data.disableInspect);
                    }
                }
            } catch (_) {}
        };
        fetchStatus();

        // Listen for live toggle updates from Admin console
        const handleUpdate = (e: CustomEvent<{ disableInspect: boolean }>) => {
            if (e.detail && typeof e.detail.disableInspect === 'boolean') {
                setEnabled(e.detail.disableInspect);
            }
        };

        window.addEventListener('system-settings-updated', handleUpdate as EventListener);
        return () => {
            window.removeEventListener('system-settings-updated', handleUpdate as EventListener);
        };
    }, []);

    useEffect(() => {
        if (!enabled) return;

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
    }, [enabled]);

    return null;
}
