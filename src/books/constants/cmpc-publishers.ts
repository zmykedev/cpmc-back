import { Publisher } from '../enums/publisher.enum';

export interface PublisherDescription {
  publisher: Publisher;
  description: string;
  category: 'CMPC_SPECIFIC' | 'ACADEMIC' | 'GOVERNMENT' | 'INTERNATIONAL' | 'TRADITIONAL';
}

export const CMPC_PUBLISHER_DESCRIPTIONS: PublisherDescription[] = [
  // Editoriales específicas de CMPC
  {
    publisher: Publisher.CMPC_EDITORIAL,
    description: 'Editorial oficial de CMPC para publicaciones corporativas y técnicas.',
    category: 'CMPC_SPECIFIC'
  },
  
  // Editoriales académicas chilenas
  {
    publisher: Publisher.UNIVERSIDAD_AUSTRAL_CHILE,
    description: 'Universidad con fuerte enfoque en ciencias forestales y medio ambiente.',
    category: 'ACADEMIC'
  },
  {
    publisher: Publisher.UNIVERSIDAD_DE_CONCEPCION,
    description: 'Universidad con programas especializados en ingeniería forestal.',
    category: 'ACADEMIC'
  },
  {
    publisher: Publisher.UNIVERSIDAD_DE_CHILE,
    description: 'Universidad líder en investigación forestal y ambiental.',
    category: 'ACADEMIC'
  },
  {
    publisher: Publisher.PONTIFICIA_UNIVERSIDAD_CATOLICA,
    description: 'Universidad con centros de investigación en sostenibilidad.',
    category: 'ACADEMIC'
  },
  {
    publisher: Publisher.UNIVERSIDAD_TECNICA_FEDERICO_SANTA_MARIA,
    description: 'Universidad técnica con programas en ingeniería industrial.',
    category: 'ACADEMIC'
  },
  
  // Editoriales especializadas en industria forestal
  {
    publisher: Publisher.INSTITUTO_FORESTAL_CHILE,
    description: 'Instituto especializado en investigación y desarrollo forestal.',
    category: 'CMPC_SPECIFIC'
  },
  {
    publisher: Publisher.CORPORACION_NACIONAL_FORESTAL,
    description: 'Corporación gubernamental para el desarrollo forestal.',
    category: 'GOVERNMENT'
  },
  {
    publisher: Publisher.CENTRO_DE_INVESTIGACION_FORESTAL,
    description: 'Centro de investigación especializado en ciencias forestales.',
    category: 'CMPC_SPECIFIC'
  },
  {
    publisher: Publisher.ASOCIACION_CHILENA_DE_BOSQUES,
    description: 'Asociación gremial de la industria forestal chilena.',
    category: 'CMPC_SPECIFIC'
  },
  {
    publisher: Publisher.SOCIEDAD_CHILENA_DE_CIENCIAS_FORESTALES,
    description: 'Sociedad científica especializada en ciencias forestales.',
    category: 'CMPC_SPECIFIC'
  },
  
  // Editoriales gubernamentales
  {
    publisher: Publisher.MINISTERIO_AGRICULTURA,
    description: 'Ministerio responsable de políticas forestales y agrícolas.',
    category: 'GOVERNMENT'
  },
  {
    publisher: Publisher.MINISTERIO_MEDIO_AMBIENTE,
    description: 'Ministerio encargado de políticas ambientales y sostenibilidad.',
    category: 'GOVERNMENT'
  },
  {
    publisher: Publisher.MINISTERIO_ENERGIA,
    description: 'Ministerio responsable de políticas energéticas y renovables.',
    category: 'GOVERNMENT'
  },
  {
    publisher: Publisher.MINISTERIO_ECONOMIA,
    description: 'Ministerio encargado de políticas económicas e industriales.',
    category: 'GOVERNMENT'
  },
  
  // Editoriales internacionales especializadas
  {
    publisher: Publisher.FAO,
    description: 'Organización internacional especializada en agricultura y silvicultura.',
    category: 'INTERNATIONAL'
  },
  {
    publisher: Publisher.WORLD_BANK,
    description: 'Banco internacional con programas de desarrollo sostenible.',
    category: 'INTERNATIONAL'
  },
  {
    publisher: Publisher.INTERNATIONAL_PAPER,
    description: 'Empresa internacional líder en la industria del papel.',
    category: 'INTERNATIONAL'
  },
  {
    publisher: Publisher.STORA_ENSO,
    description: 'Empresa internacional especializada en productos forestales.',
    category: 'INTERNATIONAL'
  },
  {
    publisher: Publisher.UPM,
    description: 'Empresa internacional líder en bioeconomía forestal.',
    category: 'INTERNATIONAL'
  },
  {
    publisher: Publisher.SAPPI,
    description: 'Empresa internacional especializada en celulosa y papel.',
    category: 'INTERNATIONAL'
  }
];

export const CMPC_SPECIFIC_PUBLISHERS = CMPC_PUBLISHER_DESCRIPTIONS
  .filter(p => p.category === 'CMPC_SPECIFIC')
  .map(p => p.publisher);

export const ACADEMIC_PUBLISHERS = CMPC_PUBLISHER_DESCRIPTIONS
  .filter(p => p.category === 'ACADEMIC')
  .map(p => p.publisher);

export const GOVERNMENT_PUBLISHERS = CMPC_PUBLISHER_DESCRIPTIONS
  .filter(p => p.category === 'GOVERNMENT')
  .map(p => p.publisher);

export const INTERNATIONAL_PUBLISHERS = CMPC_PUBLISHER_DESCRIPTIONS
  .filter(p => p.category === 'INTERNATIONAL')
  .map(p => p.publisher);

export const TRADITIONAL_PUBLISHERS = Object.values(Publisher)
  .filter(publisher => 
    !CMPC_SPECIFIC_PUBLISHERS.includes(publisher) &&
    !ACADEMIC_PUBLISHERS.includes(publisher) &&
    !GOVERNMENT_PUBLISHERS.includes(publisher) &&
    !INTERNATIONAL_PUBLISHERS.includes(publisher)
  );
