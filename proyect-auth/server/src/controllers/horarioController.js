export const getHorario = (req, res) => {
    const horario = [
        { dia: "Lunes", inicio: "10:00", fin: "11:20", ramo: "Cálculo" },
        { dia: "Lunes", inicio: "12:00", fin: "13:20", ramo: "Física" },
        { dia: "Martes", inicio: "09:00", fin: "10:20", ramo: "Programación" }
    ];

    res.json(horario);
};
