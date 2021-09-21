/* eslint-disable @typescript-eslint/no-var-requires */

const pwdResetRequestId = process.argv[2];
if (!pwdResetRequestId) {
  console.error('You need to provide the password reset request id!');
  process.exit(1);
}

const { v4 } = require('uuid');
const nodemailer = require('nodemailer');
const db = require('./dbMigrationConnect');

(async function () {
  try {
    const expDuration = 10 * 60 * 1000; // 10 minutes
    const expDate = Date.now() + expDuration;
    const date = new Date();
    date.setTime(expDate);
    const expirationDate = date.toISOString();
    const requestToken = v4().substring(0, 8);

    await db.connect();
    const updateRes = await db.query(
      `UPDATE password_reset_request
      SET status='ADMIN_AUTHORIZED', reset_token=$1, reset_token_expiration_date=$2
      WHERE id=$3`,
      [requestToken, expirationDate, pwdResetRequestId],
    );
    if (updateRes.rowCount === 0) {
      console.error('This password_reset_request id was not found.');
      process.exit(1);
    }
    const searchRes = await db.query(
      `SELECT users.email AS email, ud.device_name AS device_name
    FROM user_devices AS ud
    INNER JOIN users ON users.id=ud.user_id
    INNER JOIN password_reset_request AS prr ON prr.device_id=ud.id WHERE prr.id=$1`,
      [pwdResetRequestId],
    );

    const emailAddress = searchRes.rows[0].email;
    const deviceName = searchRes.rows[0].device_name;

    const transportOptions = {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_PORT === 465,
    };
    if (process.env.EMAIL_PASS) {
      transportOptions.auth = {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      };
    }
    const transporter = nodemailer.createTransport(transportOptions);
    const expirationTime = `${date.getHours()}:${date
      .getMinutes()
      .toLocaleString(undefined, { minimumIntegerDigits: 2 })}`;
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: emailAddress,
      subject: 'Réinitialisation de votre mot de passe UpSignOn PRO',
      text: `Bonjour,\nVous avez effectué une demande de réinitialisation de votre mot de passe depuis votre appareil "${deviceName}".\n\nPour réinitiliaser votre mot de passe UpSignOn PRO, saisissez le code suivant.\n\n${requestToken}\n\nAttention, ce code n'est valide que pour l'appareil "${deviceName}" et expirera à ${expirationTime}.\n\nBonne journée,\nUpSignOn`,
    });
    console.log("Un email a été envoyé à l'utilisateur.");
  } catch (e) {
    console.error(e);
  } finally {
    await db.release();
    process.exit(0);
  }
})();
