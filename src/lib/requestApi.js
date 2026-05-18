import axios from "axios"
import { SUPABASE_ANON_KEY } from "./supabaseClient";

export const requestApi = async ({ url, method, data, token }) => {
    const headers =
    {
        "Accept": "application/json",
        "Content-Type": "application/json; charset=utf-8",
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`

    } else {
        headers['Authorization'] = `Bearer ${SUPABASE_ANON_KEY}`
    }

    const config = {
        url: `${url}`,
        method,
        headers
    }

    if (data) {
        config.data = JSON.stringify(data)
    }

    console.log(config.url)

    return axios(config)
        .then(response => {
            return { result: response.data, responseStatus: true }
        })
        .catch((error) => {
            console.log(error)
            if (error.response) {
                //Request made and server responded
                return { responseStatus: false, errorMsg: error.response.data, statusCode: error.status }
            }


            else if (error.request) {
                //Request made but no server response
                return { responseStatus: false, errorMsg: { error: 'You have to be online for this to work' }, statusCode: error.status }
            }


            else {
                return { responseStatus: false, errorMsg: { error: 'You have to be online for this to work' }, statusCode: error.status }
            }
        })

}


export const onRequestApi = async ({ requestInfo, successCallBack, failureCallback }) => {
    try {

        if (!successCallBack || !failureCallback || !requestInfo) {
            return;
        }

        const request = await requestApi(requestInfo)

        const { result, responseStatus, errorMsg, statusCode } = request

        if (responseStatus) {
            return successCallBack({ requestInfo, result })

        } else {
            console.log(errorMsg)
            const _errorMsg = errorMsg?.message || errorMsg.error || 'Server error'
            return failureCallback({ requestInfo, errorMsg: _errorMsg, statusCode })
        }

    } catch (error) {
        console.log(error)
        return failureCallback({ requestInfo, errorMsg: 'Server error!' })
    }
}
export const getPublicImageUrl = ({ path, bucket_name }) =>
    path?.startsWith("https://")
        ?
        path
        :
        path?.startsWith("file:///")
            ?
            path
            :
            !path
                ?
                ""
                :
                `https://tzsbbbxpdlupybfrgdbs.supabase.co/storage/v1/object/public/${bucket_name}/${path}`;
