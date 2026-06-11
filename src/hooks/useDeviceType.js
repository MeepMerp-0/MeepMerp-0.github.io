// hooks/useDeviceType.js

import { useState } from 'react';

export default function useDeviceType() {
    const [isMobileDevice] = useState(() => {
        if (typeof navigator === 'undefined') {
            return false;
        }
        const touch = navigator.maxTouchPoints > 0;
        const mobileUA = /Android|iPhone|iPad|iPod|Mobile|Opera Mini|IEMobile/i.test(navigator.userAgent);
        return touch && mobileUA;
    });

    return isMobileDevice;
}