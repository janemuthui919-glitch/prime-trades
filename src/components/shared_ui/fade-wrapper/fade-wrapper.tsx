import { type ComponentType, type ReactNode } from 'react';
import { motion } from 'framer-motion';

type TFadeWrapperProps = {
    children: ReactNode;
    is_visible: boolean;
    keyname?: string;
    type?: 'top' | 'bottom';
    className?: string;
};

// framer-motion@6 typings predate React 19's children/DOM prop changes.
const MotionDiv = motion.div as ComponentType<Record<string, unknown>>;

const FadeInFromTopDiv = {
    initial: {
        y: -50,
        opacity: 0,
    },
    animate: {
        y: 0,
        opacity: 1,
    },

    transition: { duration: 250, delay: 0.3 },
};

const FadeInFromBottomDiv = {
    initial: {
        y: 50,
        opacity: 0,
    },
    animate: {
        y: 0,
        opacity: 1,
    },

    transition: { duration: 0.25, delay: 0.3 },
};

const FadeInOnlyDiv = {
    initial: {
        opacity: 0,
    },
    animate: {
        opacity: 1,
    },

    transition: { duration: 0.3 },
};

// `flipMove={false}` is necessary to fix react-pose bug: https://github.com/Popmotion/popmotion/issues/805
const FadeWrapper = ({ children, className, is_visible, keyname, type }: TFadeWrapperProps) => {
    if (type === 'top') {
        return (
            <>
                {is_visible && (
                    <MotionDiv
                        animate={FadeInFromTopDiv.animate}
                        initial={FadeInFromTopDiv.initial}
                        transition={FadeInFromTopDiv.transition}
                        className={className}
                        key={keyname}
                    >
                        {children}
                    </MotionDiv>
                )}
            </>
        );
    }
    if (type === 'bottom') {
        return (
            <>
                {is_visible && (
                    <MotionDiv
                        animate={FadeInFromBottomDiv.animate}
                        initial={FadeInFromBottomDiv.initial}
                        transition={FadeInFromBottomDiv.transition}
                        className={className}
                        key={keyname}
                    >
                        {children}
                    </MotionDiv>
                )}
            </>
        );
    }
    return (
        <>
            {is_visible && (
                <MotionDiv
                    animate={FadeInOnlyDiv.animate}
                    initial={FadeInOnlyDiv.initial}
                    transition={FadeInOnlyDiv.transition}
                    className={className}
                    key={keyname}
                >
                    {children}
                </MotionDiv>
            )}
        </>
    );
};

export default FadeWrapper;
