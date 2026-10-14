/*
import nodemailer from 'nodemailer';

// Configuration du transporteur d'email
const createTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  if (!user || !pass) {
    console.warn("[EmailService] SMTP_USER/SMTP_PASS non définis dans le fichier .env");
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
};

// Envoie un email de confirmation de commande au client et une notification à l'admin
export const sendOrderConfirmationEmail = async ({ order, userEmail, userName }) => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.log(`[EmailService] Simulation d'envoi d'email à ${userEmail} pour la commande #${order._id}`);
      return { success: false, reason: "SMTP non configuré" };
    }

    const clientEmail = userEmail || order.address?.email;
    const clientName = userName || `${order.address?.firstName || ''} ${order.address?.lastName || ''}`.trim() || 'Client';
    const orderId = order._id ? String(order._id).slice(-8).toUpperCase() : 'COMMANDE';
    const orderDate = new Date(order.date || Date.now()).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const itemsHtml = (order.items || []).map((item) => `
      <tr style="border-bottom: 1px solid #eeeeee;">
        <td style="padding: 12px 8px; vertical-align: middle;">
          <strong style="color: #242426; font-size: 14px;">${item.name}</strong><br/>
          <span style="color: #7B7B7B; font-size: 12px;">Taille: ${item.size || 'Standard'} ${item.color ? `· Couleur: ${item.color}` : ''}</span>
        </td>
        <td style="padding: 12px 8px; text-align: center; color: #242426; font-size: 14px; vertical-align: middle;">
          x${item.quantity || 1}
        </td>
        <td style="padding: 12px 8px; text-align: right; color: #E63946; font-weight: bold; font-size: 14px; vertical-align: middle;">
          ${item.price} DT
        </td>
      </tr>
    `).join('');

    const addressHtml = order.address ? `
      <p style="margin: 0; color: #585858; font-size: 13px; line-height: 1.6;">
        <strong>${clientName}</strong><br/>
        ${order.address.street || ''}<br/>
        ${order.address.city || ''}${order.address.governorate ? `, ${order.address.governorate}` : ''} ${order.address.postalCode || ''}<br/>
        ${order.address.country || 'Tunisie'}<br/>
        📞 ${order.address.phone || 'Non renseigné'}
      </p>
    ` : '<p style="color: #585858; font-size: 13px;">Adresse non renseignée</p>';

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Confirmation de commande - Měilì</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f6f6f6; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #eeeeee;">
        <div style="background-color: #242426; padding: 30px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 1px;">MĚILÌ</h1>
          <p style="color: #E63946; margin: 6px 0 0 0; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;">Confirmation de commande</p>
        </div>

        <div style="padding: 30px 25px;">
          <h2 style="color: #242426; font-size: 18px; margin-top: 0; margin-bottom: 12px;">Merci pour votre commande, ${clientName} ! 🎉</h2>
          <p style="color: #585858; font-size: 14px; line-height: 1.5; margin-bottom: 24px;">
            Votre commande <strong>#${orderId}</strong> a bien été enregistrée le <strong>${orderDate}</strong> et est en cours de préparation par notre équipe.
          </p>

          <div style="background-color: #fafafa; border-radius: 12px; padding: 16px; margin-bottom: 24px; border: 1px solid #eeeeee;">
            <h3 style="color: #242426; font-size: 14px; text-transform: uppercase; margin: 0 0 12px 0; letter-spacing: 0.5px;">Récapitulatif des articles</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="border-bottom: 2px solid #e2e2e2; text-align: left;">
                  <th style="padding: 8px; font-size: 12px; color: #7B7B7B; text-transform: uppercase;">Article</th>
                  <th style="padding: 8px; font-size: 12px; color: #7B7B7B; text-transform: uppercase; text-align: center;">Quantité</th>
                  <th style="padding: 8px; font-size: 12px; color: #7B7B7B; text-transform: uppercase; text-align: right;">Prix</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div style="border-top: 2px solid #e2e2e2; margin-top: 14px; padding-top: 14px; text-align: right;">
              <span style="font-size: 14px; color: #585858;">Mode de paiement : <strong>${order.paymentMethod === 'COD' ? 'Paiement à la livraison' : order.paymentMethod}</strong></span><br/>
              <span style="font-size: 17px; font-weight: 800; color: #242426;">Total TTC : <span style="color: #E63946;">${order.amount} DT</span></span>
            </div>
          </div>

          <div style="background-color: #fafafa; border-radius: 12px; padding: 16px; margin-bottom: 24px; border: 1px solid #eeeeee;">
            <h3 style="color: #242426; font-size: 14px; text-transform: uppercase; margin: 0 0 10px 0; letter-spacing: 0.5px;">📍 Adresse de livraison</h3>
            ${addressHtml}
          </div>

          <p style="color: #7B7B7B; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
            Une question sur votre commande ? Répondez directement à cet email ou contactez notre équipe sur Instagram @shoebox913.
          </p>
        </div>

        <div style="background-color: #f0f0f0; padding: 16px 20px; text-align: center; border-top: 1px solid #eeeeee;">
          <p style="margin: 0; color: #7B7B7B; font-size: 12px;">© ${new Date().getFullYear()} Měilì. Tous droits réservés.</p>
        </div>
      </div>
    </body>
    </html>
    `;

    if (clientEmail) {
      await transporter.sendMail({
        from: `"Měilì" <${process.env.SMTP_USER || process.env.EMAIL_USER}>`,
        to: clientEmail,
        subject: `Confirmation de votre commande #${orderId} - Měilì`,
        html: htmlContent,
      });
      console.log(`[EmailService] Email de confirmation envoyé avec succès à ${clientEmail}`);
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail && adminEmail !== clientEmail) {
      await transporter.sendMail({
        from: `"Měilì System" <${process.env.SMTP_USER || process.env.EMAIL_USER}>`,
        to: adminEmail,
        subject: `🚨 Nouvelle commande #${orderId} - ${order.amount} DT (${clientName})`,
        html: htmlContent,
      }).catch(err => console.warn("[EmailService] Erreur notification admin:", err.message));
    }

    return { success: true };
  } catch (error) {
    console.error("[EmailService] Erreur lors de l'envoi de l'email :", error);
    return { success: false, error: error.message };
  }
};
*/

