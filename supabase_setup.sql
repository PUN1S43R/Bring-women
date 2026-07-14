-- 1. Create Buckets (Run in Supabase Dashboard Storage tab)
-- Buckets: 'products', 'categories', 'sliders'
-- Set all to PUBLIC.

-- 2. Storage Policies
BEGIN;
  -- Drop existing if any
  DROP POLICY IF EXISTS "Public Access" ON storage.objects;
  DROP POLICY IF EXISTS "Admin Upload" ON storage.objects;
  DROP POLICY IF EXISTS "Admin Update Delete" ON storage.objects;

  -- Allow public access to read images
  CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id IN ('products', 'categories', 'sliders'));

  -- Allow authenticated admins to upload images
  CREATE POLICY "Admin Upload" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id IN ('products', 'categories', 'sliders') AND
    (auth.jwt() ->> 'email' IN ('moinneelam143@gmail.com', 'aquibbhombal@gmail.com'))
  );

  -- Allow authenticated admins to update/delete images
  CREATE POLICY "Admin Update Delete" ON storage.objects FOR ALL USING (
    bucket_id IN ('products', 'categories', 'sliders') AND
    (auth.jwt() ->> 'email' IN ('moinneelam143@gmail.com', 'aquibbhombal@gmail.com'))
  );
COMMIT;

-- 3. Table Policies
BEGIN;
  ALTER TABLE IF EXISTS products ENABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS categories ENABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS sliders ENABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS orders ENABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS order_items ENABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS wishlist ENABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS cart ENABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS reviews ENABLE ROW LEVEL SECURITY;

  -- Public read access
  CREATE POLICY "Public Read Products" ON products FOR SELECT USING (true);
  CREATE POLICY "Public Read Categories" ON categories FOR SELECT USING (true);
  CREATE POLICY "Public Read Sliders" ON sliders FOR SELECT USING (true);
  CREATE POLICY "Public Read Reviews" ON reviews FOR SELECT USING (true);

  -- Admin full access
  CREATE POLICY "Admin Full Access Products" ON products FOR ALL USING (auth.jwt() ->> 'email' IN ('moinneelam143@gmail.com', 'aquibbhombal@gmail.com'));
  CREATE POLICY "Admin Full Access Categories" ON categories FOR ALL USING (auth.jwt() ->> 'email' IN ('moinneelam143@gmail.com', 'aquibbhombal@gmail.com'));
  CREATE POLICY "Admin Full Access Sliders" ON sliders FOR ALL USING (auth.jwt() ->> 'email' IN ('moinneelam143@gmail.com', 'aquibbhombal@gmail.com'));
  CREATE POLICY "Admin Full Access Orders" ON orders FOR ALL USING (auth.jwt() ->> 'email' IN ('moinneelam143@gmail.com', 'aquibbhombal@gmail.com'));
  CREATE POLICY "Admin Full Access Order Items" ON order_items FOR ALL USING (auth.jwt() ->> 'email' IN ('moinneelam143@gmail.com', 'aquibbhombal@gmail.com'));
  CREATE POLICY "Admin Full Access Users" ON users FOR ALL USING (auth.jwt() ->> 'email' IN ('moinneelam143@gmail.com', 'aquibbhombal@gmail.com'));

  -- User specific access
  CREATE POLICY "Users can manage their own profile" ON users FOR ALL USING (auth.uid() = id);
  CREATE POLICY "Users can manage their own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
  CREATE POLICY "Users can manage their own wishlist" ON wishlist FOR ALL USING (auth.uid() = user_id);
  CREATE POLICY "Users can manage their own cart" ON cart FOR ALL USING (auth.uid() = user_id);
  CREATE POLICY "Users can manage their own reviews" ON reviews FOR ALL USING (auth.uid() = user_id);
COMMIT;

-- 4. Auth Sync Trigger
-- This function inserts a row into public.users when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    CASE 
      WHEN new.email IN ('moinneelam143@gmail.com', 'aquibbhombal@gmail.com') THEN 'super_admin'
      ELSE 'user'
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
