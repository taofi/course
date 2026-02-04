import nodemailer from "nodemailer";
import logger from "@src/utils/logger";

// Предполагается, что эти переменные установлены в .env
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

// Настройка транспортера Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD,
    }
});

export class EmailService {
    private async sendMail(options: nodemailer.SendMailOptions) {
        try {
            await transporter.sendMail({
                from: `"Карточкин" <${GMAIL_USER}>`, // Красивое отображение отправителя
                ...options
            });
            logger.info(`Письмо успешно отправлено на: ${options.to}`);
        } catch (error) {
            logger.error(`Ошибка отправки письма на ${options.to}:`, error);
            throw new Error("Ошибка почтового сервиса. Не удалось отправить письмо.");
        }
    }

    // 1. Метод подтверждения регистрации (уже был)
    async sendVerificationEmail(toEmail: string, code: string) {
        await this.sendMail({
            to: toEmail,
            subject: 'Код подтверждения регистрации',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
                    <h2 style="color: #333;">Подтверждение Email</h2>
                    <p>Спасибо за регистрацию! Используйте этот код для подтверждения вашей почты:</p>
                    <h1 style="color: #4CAF50; letter-spacing: 5px;">${code}</h1>
                    <p>Код действителен в течение <b>10 минут</b>.</p>
                    <hr style="border: none; border-top: 1px solid #eee;" />
                    <p style="font-size: 12px; color: #888;">Если вы не регистрировались на нашем сайте, просто проигнорируйте это письмо.</p>
                </div>
            `
        });
    }

    // 2. НОВЫЙ МЕТОД: Код для сброса пароля
    async sendResetPasswordEmail(toEmail: string, code: string) {
        await this.sendMail({
            to: toEmail,
            subject: 'Сброс пароля',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
                    <h2 style="color: #333;">Запрос на сброс пароля</h2>
                    <p>Мы получили запрос на изменение пароля для вашей учетной записи.</p>
                    <p>Введите этот код на странице восстановления:</p>
                    <h1 style="color: #f44336; letter-spacing: 5px;">${code}</h1>
                    <p>Код действителен в течение <b>15 минут</b>.</p>
                    <p>Если вы не запрашивали сброс пароля, <b>немедленно смените пароль</b> в личном кабинете или обратитесь в поддержку, так как это может означать попытку взлома.</p>
                    <hr style="border: none; border-top: 1px solid #eee;" />
                    <p style="font-size: 12px; color: #888;">Это автоматическое сообщение, на него не нужно отвечать.</p>
                </div>
            `
        });
    }
}