import MessageBox from "@/components/messagebox/instance";
import {$t} from "@/locales";

/**
 * 提示
 * @param message
 * @param options
 * @returns {Promise<unknown>}
 */
export function showAlert(message, options){
    return MessageBox.alert(message,$t('components.message.info'),options);
}

/**
 * 确认
 * @param message
 * @param options
 * @returns {Promise<unknown>}
 */
export function showConfirm(message, options){
    return MessageBox.confirm(message,$t('components.message.info'),options);
}
