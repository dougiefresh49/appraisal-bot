import { MlsArea, MlsAreaMap } from './types';

const MA7 = {
  name: 'MA7',
  description:
    'Mockingbird Lane to the North, Loop 250 to the South, Midkiff Rd to the East and Midland Dr to the West.',
  zip: '79707',
  polygon: [
    { lat: 32.04387131403258, lon: -102.150483198736 },
    { lat: 32.02945108526325, lon: -102.14571256422998 },
    { lat: 32.03360821097063, lon: -102.12934795941437 },
    { lat: 32.04773780480964, lon: -102.13392852788635 },
  ],
};

export const MlsAreas: Partial<MlsAreaMap> = {
  MA7,
};
