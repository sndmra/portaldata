import React, { useEffect, useRef, useState } from 'react';

interface FadeInProps {
    children: React.ReactNode;
    delay?: number;
    direction?: 'up' | 'down' | 'left' | 'right' | 'none';
    className?: string;
    fullWidth?: boolean;
}

const FadeIn: React.FC<FadeInProps> = ({
    children,
    delay = 0,
    direction = 'up',
    className = '',
    fullWidth = false
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const domRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    // Once visible, we can stop observing to prevent re-triggering
                    if (domRef.current) observer.unobserve(domRef.current);
                }
            });
        }, {
            threshold: 0.1, // Trigger when 10% of the element is visible
            rootMargin: '0px 0px -50px 0px' // Trigger slightly before the bottom
        });

        const currentElement = domRef.current;
        if (currentElement) {
            observer.observe(currentElement);
        }

        return () => {
            if (currentElement) {
                observer.unobserve(currentElement);
            }
        };
    }, []);

    const getDirectionClasses = () => {
        switch (direction) {
            case 'up': return 'translate-y-8';
            case 'down': return '-translate-y-8';
            case 'left': return 'translate-x-8';
            case 'right': return '-translate-x-8';
            case 'none': return '';
            default: return 'translate-y-8';
        }
    };

    return (
        <div
            ref={domRef}
            className={`transition-all duration-700 ease-out ${fullWidth ? 'w-full' : ''} ${className} ${isVisible
                    ? 'opacity-100 translate-x-0 translate-y-0'
                    : `opacity-0 ${getDirectionClasses()}`
                }`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
};

export default FadeIn;
