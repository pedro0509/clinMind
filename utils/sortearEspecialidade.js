class SortearEspecialidade {
    constructor() {
        this.especialidades = [
            'Clínica Médica',
            'Saúde da Mulher',
            'Pediatria / Puericultura',
            'Saúde do Idoso',
            'Urgência',
            'Infectologia',
            'Centro cirúrgico',
            'Hipertensão / Cardiologia',
            'Saúde Mental',
            'Obstetrícia / Urgência'
        ];
    }

    /**
   * Sorteia uma especialidade médica aleatória
   * @returns {string} Especialidade sorteada
   */
    sortearEspecialidade() {
        const indiceAleatorio = Math.floor(Math.random() * this.especialidades.length);
        return this.especialidades[indiceAleatorio];
    }

}

export default new SortearEspecialidade();