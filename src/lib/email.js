import { requestApi } from "./requestApi";

export async function sendEmail({
    from_email = 'no-reply@lavendercare.co',
    subject,
    to_email,
    to_id,
    data,
    template_id
}) {

    try {
        if (!template_id) throw new Error("Invalid email template!");

        const { result, errorMsg } = await requestApi({
            url: 'https://tzsbbbxpdlupybfrgdbs.supabase.co/functions/v1/send-email-via-mailsender',
            method: 'POST',
            data: {
                from_email, to_email, to_id, data, template_id, subject
            }
        })

        if (errorMsg) {
            console.log("Mail Sending error", errorMsg)
            return { sent: false, errorMsg }
        }

        console.log(result)

        return { sent: true, errorMsg: null }

    } catch (error) {
        console.log("Mail Sending error", error)
        return { sent: false, errorMsg: error?.message || 'Something went wrong! Try again.' }
    }
}
