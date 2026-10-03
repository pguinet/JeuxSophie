// À passer à Node : node --import ./shared/test/register.mjs --test shared/test/
import { register } from 'node:module';

register('./three-hooks.mjs', import.meta.url);
