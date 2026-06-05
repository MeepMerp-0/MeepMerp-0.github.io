// components/ScrollDebug.jsx
// Drop this anywhere in App.jsx temporarily:
//   import ScrollDebug from './components/ScrollDebug.jsx';
//   <ScrollDebug /> inside the root div
// It shows a live overlay of every scroll-relevant measurement.
// Delete when fixed.

import { useEffect, useState } from 'react';

export default function ScrollDebug() {
    const [info, setInfo] = useState({});

    useEffect(() => {
        const update = () => {
            const el = document.getElementById('outer-scroll');
            setInfo({
                outerScrollFound: !!el,
                scrollTop: el ? Math.round(el.scrollTop) : 'n/a',
                scrollHeight: el ? Math.round(el.scrollHeight) : 'n/a',
                clientHeight: el ? Math.round(el.clientHeight) : 'n/a',
                canScroll: el ? el.scrollHeight > el.clientHeight + 2 : false,
                windowScrollY: Math.round(window.scrollY),
                bodyScrollHeight: document.body.scrollHeight,
                bodyClientHeight: document.body.clientHeight,
                htmlOverflow: getComputedStyle(document.documentElement).overflow,
                bodyOverflow: getComputedStyle(document.body).overflow,
                rootOverflow: (() => { const r = document.getElementById('root'); return r ? getComputedStyle(r).overflow : 'no #root'; })(),
                outerOverflow: el ? getComputedStyle(el).overflow : 'n/a',
                outerPosition: el ? getComputedStyle(el).position : 'n/a',
                outerHeight: el ? getComputedStyle(el).height : 'n/a',
            });
        };

        update();
        const el = document.getElementById('outer-scroll');
        if (el) el.addEventListener('scroll', update);
        window.addEventListener('scroll', update);
        const t = setInterval(update, 500);
        return () => {
            if (el) el.removeEventListener('scroll', update);
            window.removeEventListener('scroll', update);
            clearInterval(t);
        };
    }, []);

    return (
        <div style={{
            position: 'fixed', bottom: 12, left: 12, zIndex: 9999,
            background: 'rgba(0,0,0,0.88)', border: '1px solid #00e5ff',
            borderRadius: 8, padding: '10px 14px', fontFamily: 'monospace',
            fontSize: 11, color: '#00e5ff', lineHeight: 1.7,
            maxWidth: 320, pointerEvents: 'none',
        }}>
            {Object.entries(info).map(([k, v]) => (
                <div key={k}>
                    <span style={{ color: '#8899aa' }}>{k}: </span>
                    <span style={{ color: String(v).includes('hidden') || v === false ? '#ff6b6b' : '#00e5ff' }}>
                        {String(v)}
                    </span>
                </div>
            ))}
        </div>
    );
}