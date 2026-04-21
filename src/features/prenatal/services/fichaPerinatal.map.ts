/**
 * Mapeamento de Coordenadas para a Ficha Perinatal de Ambulatório
 * Formatado conforme especificação JSON (snake_case)
 */

export interface PDFFieldPos {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PDFFieldMap {
  page: number;
  type: 'text' | 'radio' | 'checkbox' | 'single-checkbox' | 'date' | 'multiline';
  label: string;
  pos?: PDFFieldPos;
  options?: Record<string, PDFFieldPos>;
}

export const fichaPerinatalMap: Record<string, Record<string, PDFFieldMap>> = {
  identificacao: {
    unidade_saude: {
      page: 1,
      type: 'text',
      label: 'Unidade de Saúde',
      pos: {
        x: 420.4259416471025,
        y: 71.64735006223553,
        width: 498.7373737373737,
        height: 26.571955671921177
      }
    },
    nome_gestante: {
      page: 1,
      type: 'text',
      label: 'Nome da Gestante',
      pos: {
        x: 150.98314895373,
        y: 97.56596291736956,
        width: 517.6767676767677,
        height: 22.981150851391288
      }
    },
    idade: {
      page: 1,
      type: 'text',
      label: 'Idade',
      pos: {
        x: 106.79124581693397,
        y: 155.70390704462784,
        width: 49.45286195286195,
        height: 20.82666795907335
      }
    },
    dum: {
      page: 1,
      type: 'date',
      label: 'DUM',
      pos: {
        x: 111,
        y: 519,
        width: 170,
        height: 24
      }
    },
    dpp: {
      page: 1,
      type: 'date',
      label: 'DPP',
      pos: {
        x: 111,
        y: 559,
        width: 170,
        height: 24
      }
    }
  },

  antecedentes: {
    familiares_diabetes: {
      page: 1,
      type: 'radio',
      label: 'A. Fam: Diabetes',
      options: {
        sim: {
          x: 199.5,
          y: 485.3,
          width: 12,
          height: 12
        },
        nao: {
          x: 184.3,
          y: 485.3,
          width: 12,
          height: 12
        }
      }
    },
    familiares_hipertensao: {
      page: 1,
      type: 'radio',
      label: 'A. Fam: Hipertensão',
      options: {
        sim: {
          x: 199.5,
          y: 505.9,
          width: 12,
          height: 12
        },
        nao: {
          x: 184.3,
          y: 505.9,
          width: 12,
          height: 12
        }
      }
    },
    pessoais_diabetes: {
      page: 1,
      type: 'radio',
      label: 'A. Pess: Diabetes',
      options: {
        sim: {
          x: 298.4,
          y: 432.5,
          width: 12,
          height: 12
        },
        nao: {
          x: 284.9,
          y: 432.5,
          width: 12,
          height: 12
        }
      }
    },
    habito_fumo: {
      page: 1,
      type: 'radio',
      label: 'Hábito: Fumo',
      options: {
        sim: {
          x: 318,
          y: 450,
          width: 12,
          height: 12
        },
        nao: {
          x: 291,
          y: 450,
          width: 12,
          height: 12
        }
      }
    },
    fumo_cigarros_dia: {
      page: 1,
      type: 'text',
      label: 'Nº Cigarros/Dia',
      pos: {
        x: 328,
        y: 450,
        width: 30,
        height: 12
      }
    },
    habito_alcool: {
      page: 1,
      type: 'radio',
      label: 'Hábito: Álcool',
      options: {
        sim: {
          x: 318,
          y: 465,
          width: 12,
          height: 12
        },
        nao: {
          x: 291,
          y: 465,
          width: 12,
          height: 12
        }
      }
    },
    habito_drogas: {
      page: 1,
      type: 'radio',
      label: 'Hábito: Drogas',
      options: {
        sim: {
          x: 318,
          y: 481,
          width: 12,
          height: 12
        },
        nao: {
          x: 291,
          y: 481,
          width: 12,
          height: 12
        }
      }
    }
  },

  historia_obstetrica: {
    gestas_previas: {
      page: 1,
      type: 'text',
      label: 'Gestas Prévias',
      pos: {
        x: 445.6632466428608,
        y: 171.89148047753918,
        width: 69.44444444444443,
        height: 30.162760492451063
      }
    },
    abortos: {
      page: 1,
      type: 'text',
      label: 'Abortos',
      pos: {
        x: 563.6380256627144,
        y: 156.09193926720766,
        width: 72.60101010101009,
        height: 30.162760492451063
      }
    },
    parto_vaginal: {
      page: 1,
      type: 'text',
      label: 'Partos Vaginais',
      pos: {
        x: 662.7255577832359,
        y: 175.48228529806906,
        width: 70.49663299663298,
        height: 30.88092145655704
      }
    },
    cesareas: {
      page: 1,
      type: 'text',
      label: 'Cesáreas',
      pos: {
        x: 701.6565342142123,
        y: 250.55539772660472,
        width: 34.722222222222214,
        height: 31.59908242066302
      }
    },
    ectopica: {
      page: 1,
      type: 'single-checkbox',
      label: 'Ectópica',
      pos: {
        x: 470.53365996389675,
        y: 214.37378735230038,
        width: 24.2003367003367,
        height: 19.390346030861398
      }
    },
    nascidos_vivos: {
      page: 1,
      type: 'text',
      label: 'Nascidos Vivos',
      pos: {
        x: 765.387217203776,
        y: 176.68276341113378,
        width: 67.34006734006734,
        height: 28.726438564239107
      }
    },
    vivem: {
      page: 1,
      type: 'text',
      label: 'Vivem',
      pos: {
        x: 854.3703612253721,
        y: 176.68276341113378,
        width: 66.28787878787878,
        height: 31.59908242066302
      }
    },
    mortos_menor_1_semana: {
      page: 1,
      type: 'text',
      label: 'Mortos < 1 semana',
      pos: {
        x: 890.144771999783,
        y: 212.9103546723612,
        width: 32.617845117845114,
        height: 28.726438564239107
      }
    },
    nascidos_mortos: {
      page: 1,
      type: 'text',
      label: 'Nascidos Mortos',
      pos: {
        x: 770.6481599647187,
        y: 238.08366293686197,
        width: 30.51346801346801,
        height: 30.162760492451063
      }
    },
    mortos_maior_1_semana: {
      page: 1,
      type: 'text',
      label: 'Mortos > 1 semana',
      pos: {
        x: 889.0925834475944,
        y: 251.72872125487555,
        width: 33.67003367003367,
        height: 30.88092145655704
      }
    }
  },

  exames: {
    abo_rh_data_1: {
      page: 1, type: 'date', label: 'ABO-RH Data (1ª)',
      pos: { x: 89, y: 460, width: 80, height: 15 }
    },
    abo_rh_result_1: {
      page: 1, type: 'text', label: 'ABO-RH Rez (1ª)',
      pos: { x: 205, y: 460, width: 80, height: 15 }
    },
    glicemia_data_1: {
      page: 1, type: 'date', label: 'Glicemia Data (1ª)',
      pos: { x: 89, y: 480, width: 80, height: 15 }
    },
    glicemia_result_1: {
      page: 1, type: 'text', label: 'Glicemia Rez (1ª)',
      pos: { x: 205, y: 480, width: 80, height: 15 }
    },
    vdrl_data_1: {
      page: 1, type: 'date', label: 'VDRL Data (1ª)',
      pos: { x: 89, y: 543, width: 80, height: 15 }
    },
    vdrl_result_1: {
      page: 1, type: 'text', label: 'VDRL Rez (1ª)',
      pos: { x: 205, y: 543, width: 80, height: 15 }
    },
    hiv_data_1: {
      page: 1, type: 'date', label: 'HIV Data (1ª)',
      pos: { x: 89, y: 564, width: 80, height: 15 }
    },
    hiv_result_1: {
      page: 1, type: 'text', label: 'HIV Rez (1ª)',
      pos: { x: 205, y: 564, width: 80, height: 15 }
    },
    hb_ht_data_1: {
      page: 1, type: 'date', label: 'HB/Ht Data (1ª)',
      pos: { x: 89, y: 585, width: 80, height: 15 }
    },
    hb_ht_result_1: {
      page: 1, type: 'text', label: 'HB/Ht Rez (1ª)',
      pos: { x: 205, y: 585, width: 80, height: 15 }
    },
    urina_data_1: {
      page: 1, type: 'date', label: 'Urina Data (1ª)',
      pos: { x: 89, y: 606, width: 80, height: 15 }
    },
    urina_result_1: {
      page: 1, type: 'text', label: 'Urina Rez (1ª)',
      pos: { x: 205, y: 606, width: 80, height: 15 }
    },
    glicemia_data_2: {
      page: 1, type: 'date', label: 'Glicemia Data (2ª)',
      pos: { x: 462, y: 480, width: 80, height: 15 }
    },
    glicemia_result_2: {
      page: 1, type: 'text', label: 'Glicemia Rez (2ª)',
      pos: { x: 578, y: 480, width: 80, height: 15 }
    },
    vdrl_data_2: {
      page: 1, type: 'date', label: 'VDRL Data (2ª)',
      pos: { x: 462, y: 543, width: 80, height: 15 }
    },
    vdrl_result_2: {
      page: 1, type: 'text', label: 'VDRL Rez (2ª)',
      pos: { x: 578, y: 543, width: 80, height: 15 }
    },
    hiv_data_2: {
      page: 1, type: 'date', label: 'HIV Data (2ª)',
      pos: { x: 462, y: 564, width: 80, height: 15 }
    },
    hiv_result_2: {
      page: 1, type: 'text', label: 'HIV Rez (2ª)',
      pos: { x: 578, y: 564, width: 80, height: 15 }
    },
    hb_ht_data_2: {
      page: 1, type: 'date', label: 'HB/Ht Data (2ª)',
      pos: { x: 462, y: 585, width: 80, height: 15 }
    },
    hb_ht_result_2: {
      page: 1, type: 'text', label: 'HB/Ht Rez (2ª)',
      pos: { x: 578, y: 585, width: 80, height: 15 }
    },
    urina_data_2: {
      page: 1, type: 'date', label: 'Urina Data (2ª)',
      pos: { x: 462, y: 606, width: 80, height: 15 }
    },
    urina_result_2: {
      page: 1, type: 'text', label: 'Urina Rez (2ª)',
      pos: { x: 578, y: 606, width: 80, height: 15 }
    }
  },

  intercorrencias_clinicas: {
    diabetes: {
      page: 1, type: 'radio', label: 'Diabetes',
      options: {
        sim: { x: 673, y: 493, width: 12, height: 12 },
        nao: { x: 651, y: 493, width: 12, height: 12 }
      }
    },
    cardiopatia: {
      page: 1, type: 'radio', label: 'Cardiopatia',
      options: {
        sim: { x: 673, y: 512, width: 12, height: 12 },
        nao: { x: 651, y: 512, width: 12, height: 12 }
      }
    },
    hipertensao: {
      page: 1, type: 'radio', label: 'Hipertensão',
      options: {
        sim: { x: 673, y: 531, width: 12, height: 12 },
        nao: { x: 651, y: 531, width: 12, height: 12 }
      }
    },
    infeccao_urinaria: {
      page: 1, type: 'radio', label: 'Infec. Urinária',
      options: {
        sim: { x: 785, y: 493, width: 12, height: 12 },
        nao: { x: 763, y: 493, width: 12, height: 12 }
      }
    },
    cirurgia_pelvica: {
      page: 1, type: 'radio', label: 'Cirur. Pélvica',
      options: {
        sim: { x: 785, y: 512, width: 12, height: 12 },
        nao: { x: 763, y: 512, width: 12, height: 12 }
      }
    },
    outras: {
      page: 1, type: 'radio', label: 'Outras',
      options: {
        sim: { x: 785, y: 531, width: 12, height: 12 },
        nao: { x: 763, y: 531, width: 12, height: 12 }
      }
    }
  },

  vacinacao: {
    influenza: {
      page: 1, type: 'date', label: 'Influenza',
      pos: { x: 89, y: 834, width: 80, height: 15 }
    },
    dtpa: {
      page: 1, type: 'date', label: 'dTpa',
      pos: { x: 205, y: 834, width: 80, height: 15 }
    },
    dt: {
      page: 1, type: 'date', label: 'dT',
      pos: { x: 89, y: 855, width: 80, height: 15 }
    },
    hepatite_b: {
      page: 1, type: 'date', label: 'Hepatite B',
      pos: { x: 205, y: 855, width: 80, height: 15 }
    }
  },

  ultrassom_suplementacao: {
    dt_us_1: {
      page: 1, type: 'date', label: 'Data US 1',
      pos: { x: 462, y: 734, width: 80, height: 15 }
    },
    peso_fetal_1: {
      page: 1, type: 'text', label: 'Peso Fetal 1',
      pos: { x: 578, y: 734, width: 80, height: 15 }
    },
    dt_us_2: {
      page: 1, type: 'date', label: 'Data US 2',
      pos: { x: 462, y: 755, width: 80, height: 15 }
    },
    peso_fetal_2: {
      page: 1, type: 'text', label: 'Peso Fetal 2',
      pos: { x: 578, y: 755, width: 80, height: 15 }
    },
    ferro_mensal: {
      page: 1, type: 'text', label: 'Sulfato Ferroso (Controle)',
      pos: { x: 462, y: 785, width: 196, height: 15 }
    }
  }
};
