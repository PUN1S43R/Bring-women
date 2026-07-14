/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

import imageCompression from 'browser-image-compression';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  const msg = 'CRITICAL ERROR: Supabase credentials missing! Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.';
  console.error(msg);
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

export const uploadImage = async (file: File, bucket: string, log?: (msg: string) => void) => {
  const logMsg = (msg: string) => {
    console.log(msg);
    if (log) log(msg);
  };

  logMsg(`Starting upload to bucket: ${bucket}, file: ${file.name}, size: ${file.size}`);
  
  if (!supabaseUrl || !supabaseAnonKey) {
    logMsg('ERROR: Supabase URL or Anon Key is missing. Check environment variables.');
    throw new Error('Supabase credentials missing');
  }

  try {
    // Image Compression Options
    const options = {
      maxSizeMB: 1, // Max size 1MB
      maxWidthOrHeight: 1920, // Max resolution 1080p
      useWebWorker: false, // Disabled web worker to prevent hangs on some mobile browsers
    };

    let fileToUpload = file;
    
    // Only compress if it's an image and larger than 200KB
    if (file.type.startsWith('image/') && file.size > 200 * 1024) {
      logMsg('Compressing image...');
      try {
        fileToUpload = await imageCompression(file, options);
        logMsg(`Compression complete. New size: ${fileToUpload.size}`);
      } catch (compressionError) {
        logMsg(`Compression failed, uploading original: ${compressionError}`);
      }
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    logMsg(`Uploading to Supabase path: ${filePath}...`);
    
    try {
      logMsg('Initiating Supabase storage upload call...');
      // Add a timeout to the upload call
      const uploadPromise = supabase.storage
        .from(bucket)
        .upload(filePath, fileToUpload, {
          cacheControl: '3600',
          upsert: false
        });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Upload timed out after 30 seconds')), 30000)
      );

      logMsg('Waiting for upload response or timeout...');
      const result = await Promise.race([uploadPromise, timeoutPromise]) as any;
      const { data, error } = result;
      
      if (error) {
        logMsg(`Supabase Storage Error: ${JSON.stringify(error)}`);
        throw error;
      }

      logMsg('Upload successful, fetching public URL...');
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      logMsg(`Public URL generated: ${publicUrl}`);
      return publicUrl;
    } catch (uploadError: any) {
      logMsg(`UPLOAD CALL FAILED: ${uploadError.message || JSON.stringify(uploadError)}`);
      throw uploadError;
    }
  } catch (error: any) {
    logMsg(`Error in uploadImage: ${error.message || JSON.stringify(error)}`);
    throw error;
  }
};

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: 'user' | 'admin' | 'super_admin';
          created_at: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          image_url: string;
          description: string | null;
          created_at: string;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          category_id: string;
          main_image: string;
          description: string | null;
          original_price: number;
          discount_price: number;
          tax_rate: number;
          stock_quantity: number;
          is_cod_available: boolean;
          tag: 'Premium' | '@599' | null;
          sizes: string[];
          colors: string[];
          created_at: string;
        };
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          image_url: string;
        };
      };
      sliders: {
        Row: {
          id: string;
          desktop_banner: string;
          mobile_banner: string;
          category_id: string | null;
          description: string | null;
          button_text: string | null;
          show_button: boolean;
          show_description: boolean;
          created_at: string;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          total_amount: number;
          advance_paid: number;
          payment_method: 'COD' | 'Online';
          status: 'Pending' | 'Packed' | 'Shipped' | 'Delivered';
          shipping_address: string;
          created_at: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          quantity: number;
          price: number;
          size: string;
          color: string;
        };
      };
      reviews: {
        Row: {
          id: string;
          product_id: string;
          user_id: string;
          rating: number;
          comment: string | null;
          image_url: string | null;
          created_at: string;
        };
      };
      wishlist: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
        };
      };
      cart: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          quantity: number;
          size: string;
          color: string;
        };
      };
      settings: {
        Row: {
          key: string;
          value: string;
          updated_at: string;
        };
      };
      password_reset_otp: {
        Row: {
          id: string;
          email: string;
          otp: string;
          expires_at: string;
        };
      };
    };
  };
};
