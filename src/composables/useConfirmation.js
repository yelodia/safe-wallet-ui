import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';

export function useConfirmation() {
    const confirm = useConfirm();
    const toast = useToast();

    const confirmAction = async ({
        message,
        header,
        icon = 'pi pi-exclamation-triangle',
        acceptLabel = 'Confirm',
        rejectLabel = 'Cancel',
        acceptSeverity = 'danger',
        onAccept,
        onFinally,
        successMessage,
        errorMessage = 'Something went wrong'
    }) => {
        confirm.require({
            message,
            header,
            icon,
            rejectProps: {
                label: rejectLabel,
                severity: 'secondary',
                outlined: true
            },
            acceptProps: {
                label: acceptLabel,
                severity: acceptSeverity
            },
            accept: async () => {
                try {
                    await onAccept();
                    
                    if (successMessage) {
                        toast.add({
                            severity: 'success',
                            summary: 'Success',
                            detail: successMessage,
                            life: 5000
                        });
                    }
                } catch (error) {
                    toast.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: errorMessage,
                        life: 5000
                    });
                } finally {
                    if (onFinally) {
                        onFinally();
                    }
                }
            }
        });
    };

    return {
        confirmAction
    };
}
