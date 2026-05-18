import { createClient } from '@supabase/supabase-js'

export const SUPABASE_URL = 'https://tzsbbbxpdlupybfrgdbs.supabase.co'
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6c2JiYnhwZGx1cHliZnJnZGJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5NzU0MTEsImV4cCI6MjA2NzU1MTQxMX0.3MPot37N05kaUG8W84JItSKgH2bymVBee1MxJ905XEk'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: { params: { eventsPerSecond: 10 } },
  debug: true,
})

export function generateNumericCode(length = 6) {
    const charset = '0123456789';
    let code = '';
    if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
        const values = new Uint32Array(length);
        window.crypto.getRandomValues(values);
        for (let i = 0; i < length; i++) {
            code += charset[values[i] % charset.length];
        }
    } else {
        for (let i = 0; i < length; i++) {
            code += charset.charAt(Math.floor(Math.random() * charset.length));
        }
    }
    return code;
}

export async function createOrUpdateOtp({ email, requiresAuth }) {
    const { data: userExistsData, error: _existsError } = await supabase
        .rpc('user_exists', { email_input: email });

    const userAlreadyExists = userExistsData === true ? true : false

    if (requiresAuth) {
        if (!userAlreadyExists) {
            return { userAlreadyExists }
        }
    } else {
        if (userAlreadyExists) {
            return { userAlreadyExists };
        }
    }

    const otp = generateNumericCode(6)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: otpError } = await supabase
        .from('otps')
        .upsert(
            {
                email,
                otp,
                expires_at: expiresAt,
            },
            { onConflict: ['email'] }
        );

    if (otpError) {
        console.log('Error upserting OTP:', otpError);
        return { error: 'Error sending OTP to mail', userAlreadyExists }
    }

    return { token: { otp, expiresAt }, userAlreadyExists };
}

export async function validateOtp({ email, otp }) {
    const { data: isValid, error } = await supabase
        .rpc('validate_otp', { provider_email: email, provider_otp: otp });

    if (error) {
        console.error('OTP validation error:', error);
        throw error;
    }

    return isValid; // boolean
}

export function getAdminProductImageUrl(path) {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }

  const { data } = supabase.storage.from('admin_products').getPublicUrl(path)
  return data?.publicUrl || ''
}
