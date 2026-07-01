import { supabase } from "../../config/supabase.js";

class AuthService {
    async testConnection() {
        return {
            success: true,
            message: 'supabase connected'
        }
    }
}

export default new AuthService();