import { useState } from 'react';
import { ACTIONS, STATUS, type EventData } from 'react-joyride';

export const useTourHandler = () => {
    const [is_finished, setIsFinished] = useState(false);
    const [is_close_tour, setIsCloseTour] = useState(false);

    const handleJoyrideCallback = (data: EventData) => {
        const { action, status } = data;
        if (status === STATUS.FINISHED) {
            setIsFinished(true);
        } else if (action === ACTIONS.CLOSE || action === ACTIONS.SKIP) {
            setIsCloseTour(true);
        }
    };

    return {
        is_finished,
        handleJoyrideCallback,
        setIsFinished,
        is_close_tour,
        setIsCloseTour,
    };
};
