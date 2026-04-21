/**
 * Mapeamento de Coordenadas para a Ficha Perinatal de Ambulatório
 * 
 * Sistema de Coordenadas:
 * - Unidade: 0 a 1000 (Relativo à largura/altura da página)
 * - Origem: Canto Superior Esquerdo (Top-Left)
 */

export interface PDFFieldPos {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PDFFieldMap {
  page: number;
  type: 'text' | 'radio' | 'checkbox' | 'date' | 'multiline';
  label: string;
  pos?: PDFFieldPos;
  options?: Record<string, PDFFieldPos>;
}

export const fichaPerinatalMap: Record<string, Record<string, PDFFieldMap>> = {
  identificacao: {
    unidadeSaude: {
      page: 1, type: 'text', label: 'Unidade de Saúde',
      pos: { x: 432, y: 137, width: 498, height: 34 }
    },
    nomeGestante: {
      page: 1, type: 'text', label: 'Nome da Gestante',
      pos: { x: 111, y: 178, width: 553, height: 24 }
    },
    idade: {
      page: 1, type: 'text', label: 'Idade',
      pos: { x: 111, y: 290, width: 96, height: 24 }
    },
    dum: {
      page: 1, type: 'date', label: 'DUM',
      pos: { x: 111, y: 519, width: 170, height: 24 }
    },
    dpp: {
      page: 1, type: 'date', label: 'DPP',
      pos: { x: 111, y: 559, width: 170, height: 24 }
    }
  },

  antecedentes: {
    familiaresDiabetes: {
      page: 1, type: 'radio', label: 'A. Fam: Diabetes',
      options: {
        sim: { x: 199.5, y: 485.3, width: 12, height: 12 },
        nao: { x: 184.3, y: 485.3, width: 12, height: 12 }
      }
    },
    familiaresHipertensao: {
      page: 1, type: 'radio', label: 'A. Fam: Hipertensão',
      options: {
        sim: { x: 199.5, y: 505.9, width: 12, height: 12 },
        nao: { x: 184.3, y: 505.9, width: 12, height: 12 }
      }
    },
    pessoaisDiabetes: {
      page: 1, type: 'radio', label: 'A. Pess: Diabetes',
      options: {
        sim: { x: 298.4, y: 432.5, width: 12, height: 12 },
        nao: { x: 284.9, y: 432.5, width: 12, height: 12 }
      }
    },
    habitoFumo: {
      page: 1, type: 'radio', label: 'Hábito: Fumo',
      options: {
        sim: { x: 318, y: 450, width: 12, height: 12 },
        nao: { x: 291, y: 450, width: 12, height: 12 }
      }
    },
    fumoCigarrosDia: {
      page: 1, type: 'text', label: 'Nº Cigarros/Dia',
      pos: { x: 328, y: 450, width: 30, height: 12 }
    },
    habitoAlcool: {
      page: 1, type: 'radio', label: 'Hábito: Álcool',
      options: {
        sim: { x: 318, y: 465, width: 12, height: 12 },
        nao: { x: 291, y: 465, width: 12, height: 12 }
      }
    },
    habitoDrogas: {
      page: 1, type: 'radio', label: 'Hábito: Drogas',
      options: {
        sim: { x: 318, y: 481, width: 12, height: 12 },
        nao: { x: 291, y: 481, width: 12, height: 12 }
      }
    }
  },

  historiaObstetrica: {
    gestasPrevias: {
      page: 1, type: 'text', label: 'Gestas Prévias',
      pos: { x: 271, y: 192, width: 25, height: 12 }
    },
    abortos: {
      page: 1, type: 'text', label: 'Abortos',
      pos: { x: 329, y: 192, width: 25, height: 12 }
    },
    partoVaginal: {
      page: 1, type: 'text', label: 'Partos Vaginais',
      pos: { x: 386, y: 192, width: 25, height: 12 }
    },
    cesareas: {
      page: 1, type: 'text', label: 'Cesáreas',
      pos: { x: 386, y: 280, width: 25, height: 12 }
    },
    ectopica: {
      page: 1, type: 'text', label: 'Ectópica',
      pos: { x: 238, y: 251, width: 25, height: 12 }
    },
    nascidosVivos: {
      page: 1, type: 'text', label: 'Nascidos Vivos',
      pos: { x: 435, y: 209, width: 25, height: 12 }
    },
    vivem: {
      page: 1, type: 'text', label: 'Vivem',
      pos: { x: 484, y: 209, width: 25, height: 12 }
    },
    mortos1Semana: {
      page: 1, type: 'text', label: 'Mortos < 1 semana',
      pos: { x: 484, y: 256, width: 25, height: 12 }
    },
    nascidosMortos: {
      page: 1, type: 'text', label: 'Nascidos Mortos',
      pos: { x: 435, y: 302, width: 25, height: 12 }
    },
    mortosApos1Semana: {
      page: 1, type: 'text', label: 'Mortos > 1 semana',
      pos: { x: 484, y: 302, width: 25, height: 12 }
    }
  },

  exames: {
    aboRhData1: {
      page: 1, type: 'date', label: 'ABO-RH Data (1ª)',
      pos: { x: 89, y: 460, width: 80, height: 15 }
    },
    aboRhResult1: {
      page: 1, type: 'text', label: 'ABO-RH Rez (1ª)',
      pos: { x: 205, y: 460, width: 80, height: 15 }
    },
    glicemiaData1: {
      page: 1, type: 'date', label: 'Glicemia Data (1ª)',
      pos: { x: 89, y: 480, width: 80, height: 15 }
    },
    glicemiaResult1: {
      page: 1, type: 'text', label: 'Glicemia Rez (1ª)',
      pos: { x: 205, y: 480, width: 80, height: 15 }
    },
    vdrlData1: {
      page: 1, type: 'date', label: 'VDRL Data (1ª)',
      pos: { x: 89, y: 543, width: 80, height: 15 }
    },
    vdrlResult1: {
      page: 1, type: 'text', label: 'VDRL Rez (1ª)',
      pos: { x: 205, y: 543, width: 80, height: 15 }
    },
    hivData1: {
      page: 1, type: 'date', label: 'HIV Data (1ª)',
      pos: { x: 89, y: 564, width: 80, height: 15 }
    },
    hivResult1: {
      page: 1, type: 'text', label: 'HIV Rez (1ª)',
      pos: { x: 205, y: 564, width: 80, height: 15 }
    }
  }
};
