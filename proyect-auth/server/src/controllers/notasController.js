export const getNotas = (req, res) => {
    const notas = [
        { ramo: "Cálculo", nota: 5.6 },
        { ramo: "Física", nota: 4.8 }
    ];

    res.json(notas);
};
