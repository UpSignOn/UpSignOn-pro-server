import https from 'https';
import http from 'http';

const getCertificate = (domain: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const options: https.RequestOptions = {
      host: domain,
      method: 'GET',
      rejectUnauthorized: false,
    };
    const request = https.request(options, function (res: http.IncomingMessage) {
      // @ts-ignore
      const cert = res.socket.getPeerCertificate(true);
      resolve(cert);
    });
    request.on('error', reject);
    request.end();
  });
};

export const checkServerCertificateChain = async (domain: string): Promise<boolean> => {
  try {
    let cert = await getCertificate(domain);
    do {
      if (cert.ca) {
        return true;
      }
      cert = cert.issuerCertificate;
    } while (
      cert &&
      typeof cert === 'object' &&
      !!cert.issuerCertificate &&
      cert !== cert.issuerCertificate
    );
    return false;
  } catch (e) {
    return false;
  }
};
