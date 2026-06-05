// hooks/useDeviceType.js

import { useEffect, useState } from 'react';

export default function useDeviceType() {
    const [isMobileDevice, setIsMobileDevice] =
        useState(false);

    useEffect(() => {
        if (typeof navigator === 'undefined') {
            return;
        }

        const touch =
            navigator.maxTouchPoints > 0;

        const mobileUA =
            /Android|iPhone|iPad|iPod|Mobile|Opera Mini|IEMobile/i.test(
                navigator.userAgent
            );

        setIsMobileDevice(
            touch && mobileUA
        );
    }, []);

    return isMobileDevice;
}