export const gameQuestions = [
    {
        question: "Name something that gets forwarded in the WhatsApp group.",
        answers: [
            { text: "Jokes", points: 30 },
            { text: "Memes", points: 25 },
            { text: "Videos", points: 20 },
            { text: "Messages", points: 15 },
            { text: "Photos", points: 10 },
        ],
    },
    {
        question: "Name something you'd never pay full price for.",
        answers: [
            { text: "Clothes", points: 30 },
            { text: "Electronics", points: 25 },
            { text: "Furniture", points: 20 },
            { text: "Toys", points: 15 },
            { text: "Shoes", points: 10 },
        ],
    },
];

export var createInitialGameState = () => {
    return {
        started: true,
        currentQuestionIndex: 0,
        questions: gameQuestions.map((question) => ({
            question: question.question,
            answers: question.answers.map((answer) => ({
                ...answer,
                revealed: false,
            })),
        })),
    };
};