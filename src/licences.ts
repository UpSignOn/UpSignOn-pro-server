import Joi from 'joi';
import { db } from './helpers/db';
import { logError } from './helpers/logger';

export const updateLicences = async (req: any, res: any) => {
  try {
    const expectedSchema = Joi.array().items(
      Joi.object({
        masterBank: Joi.number().allow(null),
        licences: Joi.array().items(
          Joi.object({
            nb_licences: Joi.number().positive().required(),
            valid_from: Joi.string().isoDate().required(),
            valid_until: Joi.string().isoDate().required(),
            to_be_renewed: Joi.boolean(),
          }),
        ),
      }),
    );
    const licences = req.body.licences;
    Joi.assert(licences, expectedSchema);
    await db.query(
      "INSERT INTO settings (key, value) VALUES ('LICENCES', $1) ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value",
      [JSON.stringify(licences)],
    );
    return res.status(200).end();
  } catch (e) {
    logError('update licences', e);
    return res.status(500).end();
  }
};
