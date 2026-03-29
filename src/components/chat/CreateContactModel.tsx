import { useState, useEffect } from 'react';

// material-ui
import {
  Button,
  Divider,
  CardContent,
  Modal,
  Stack,
  TextField,
  Box
} from '@mui/material';

// project import
import MainCard from 'components/MainCard';
import { contactService } from 'service/contact.service';
import { contactAttributeService } from 'service/contactAttribute.service';

// phone input
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

// formik
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useSnackbar } from "notistack";


interface CreateContactModalProps {
  contactModalOpen: boolean;
  handleClose: () => void;
  channelId: string;
  contactCreateRefresh: () => void;
  contactId?: string;
}

export const CreateContactModal = ({
  contactModalOpen,
  handleClose,
  channelId,
  contactCreateRefresh,
  contactId
}: CreateContactModalProps) => {
  const { enqueueSnackbar } = useSnackbar();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [attributes, setAttributes] = useState<any[]>([]);

  const isEdit = Boolean(contactId);

  // ================= FORM =================
  const formik = useFormik({
    initialValues: {
      fullName: '',
      phone: '',
      attributes: {} as Record<string, any>
    },
    validationSchema: Yup.object({
      fullName: Yup.string().required('Full Name is required'),
      phone: Yup.string().required('Phone is required')
    }),
    validateOnMount: true,
    onSubmit: async (values, { resetForm }) => {
      try {
        setLoading(true);

        const finalPhone = `+${values.phone}`;

        if (isEdit && contactId) {
          await contactService.updateContact(contactId, {
            name: values.fullName,
            phone: finalPhone,
            attributes: values.attributes // 🔥 important
          });
        } else {
          await contactService.createContact(channelId, values.fullName, finalPhone, values.attributes);
        }

        resetForm();
        handleClose();
        contactCreateRefresh();
        enqueueSnackbar(
          isEdit ? 'Contact updated successfully' : 'Contact created successfully',
          { variant: 'success' }
        );
      } catch (error) {
        console.error(error);
        enqueueSnackbar('Failed to save contact', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    }
  });

  const parseValue = (value: any) => {
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return value || '';
  };

  const handleAttributeChange = (key: string, value: string) => {
    let finalValue: any = value;

    try {
      // try JSON parse
      if (value.startsWith('{') || value.startsWith('[')) {
        finalValue = JSON.parse(value);
      }
    } catch {
      // keep as string
    }

    formik.setFieldValue(`attributes.${key}`, finalValue);
  };

  // ================= FETCH ATTRIBUTE DEFINITIONS =================
  useEffect(() => {
    const fetchAttributes = async () => {
      try {
        const res = await contactAttributeService.getAttributes();
        setAttributes(res.data || []);
      } catch (err) {
        console.error(err);
      }
    };

    if (contactModalOpen) {
      fetchAttributes();
    }
  }, [contactModalOpen]);

  // ================= INIT EMPTY ATTRIBUTES (CREATE MODE) =================
  useEffect(() => {
    if (!attributes.length || isEdit) return;

    const initialAttr: Record<string, any> = {};

    attributes.forEach((attr) => {
      initialAttr[attr.id] = '';
    });

    formik.setFieldValue('attributes', initialAttr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attributes, isEdit]);

  // ================= FETCH CONTACT (EDIT MODE) =================
  useEffect(() => {
    const fetchContact = async () => {
      if (!contactId) return;

      try {
        setFetching(true);

        const res = await contactService.getContactById(contactId);
        const contact = res.data;

        formik.setValues({
          fullName: contact.name || '',
          phone: contact.phone?.replace('+', '') || '',
          attributes: contact.attributes || {}
        });
      } catch (error) {
        console.error(error);
      } finally {
        setFetching(false);
      }
    };

    if (contactModalOpen && contactId) {
      fetchContact();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactId, contactModalOpen]);

  useEffect(() => {
    if (!attributes.length || !isEdit) return;

    const merged: Record<string, any> = {};

    attributes.forEach((attr) => {
      merged[attr.id] = formik.values.attributes?.[attr.id] ?? '';
    });

    formik.setFieldValue('attributes', merged);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attributes]);

  return (
    <Modal open={contactModalOpen} onClose={handleClose}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          p: 2
        }}
      >
        <MainCard
          title={isEdit ? 'Edit Contact' : 'Add New Contact'}
          modal
          darkTitle
          content={false}
          sx={{
            width: { xs: '95%', sm: 600 },
            borderRadius: 3,
            boxShadow: 10
          }}
        >
          <form onSubmit={formik.handleSubmit}>
            <CardContent>
              <Stack spacing={3}>

                {/* FULL NAME */}
                <TextField
                  label="Full Name"
                  fullWidth
                  name="fullName"
                  value={formik.values.fullName}
                  onChange={formik.handleChange}
                  error={formik.touched.fullName && Boolean(formik.errors.fullName)}
                  helperText={formik.touched.fullName && formik.errors.fullName}
                  disabled={fetching}
                />

                {/* PHONE */}
                <Box
                  sx={{
                    width: '100%', // 🔥 important
                    '& .react-tel-input': {
                      width: '100%'
                    },
                    '& .react-tel-input .form-control': {
                      width: '100% !important', // 🔥 force full width
                      height: '56px !important',
                      borderRadius: '12px !important',
                      fontSize: '16px !important'
                    },
                    '& .react-tel-input .flag-dropdown': {
                      borderRadius: '12px 0 0 12px'
                    }
                  }}
                >
                  <PhoneInput
                    country={'in'}
                    enableSearch
                    value={formik.values.phone}
                    onChange={(value) => formik.setFieldValue('phone', value)}
                    disabled={fetching}
                    inputStyle={{
                      width: '100%' // 🔥 extra safety
                    }}
                  />
                </Box>

                {/* 🔥 DYNAMIC ATTRIBUTES */}
                {attributes.map((attr) => {
                  const value = formik.values.attributes?.[attr.id];

                  const isObject = typeof value === 'object';

                  return (
                    <TextField
                      key={attr.id}
                      label={attr.name}
                      fullWidth
                      multiline={isObject} // 🔥 object → textarea
                      minRows={isObject ? 4 : 1}
                      value={parseValue(value)}
                      onChange={(e) =>
                        handleAttributeChange(attr.id, e.target.value)
                      }
                    />
                  );
                })}

              </Stack>
            </CardContent>

            <Divider />

            <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ px: 2.5, py: 2 }}>
              <Button color="error" size="small" onClick={handleClose}>
                Cancel
              </Button>

              <Button
                type="submit"
                variant="contained"
                size="small"
                disabled={
                  loading ||
                  fetching ||
                  !formik.values.fullName ||
                  !formik.values.phone ||
                  !formik.isValid
                }
              >
                {loading
                  ? isEdit
                    ? 'Updating...'
                    : 'Creating...'
                  : isEdit
                    ? 'Update'
                    : 'Submit'}
              </Button>
            </Stack>
          </form>
        </MainCard>
      </Box>
    </Modal>
  );
};