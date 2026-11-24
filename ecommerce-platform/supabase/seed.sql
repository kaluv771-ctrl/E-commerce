insert into public.categories(name, description) values
('Home & Living','Thoughtful pieces for your space'),
('Accessories','Small details for everyday life'),
('Technology','Useful tools and devices'),
('Lifestyle','Everyday essentials')
on conflict (name) do nothing;

insert into public.products(name, description, price, category_id, image_url, stock_quantity, is_featured)
select 'Everyday Ceramic Vase','A clean, sculptural ceramic vase for a calm corner.',18500,id,'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=900',24,true
from public.categories where name='Home & Living'
on conflict do nothing;

insert into public.products(name, description, price, category_id, image_url, stock_quantity, is_featured)
select 'Canvas Weekend Tote','A practical carry-all for errands, books, and days out.',12500,id,'https://images.unsplash.com/photo-1544816155-12df9643f363?w=900',35,true
from public.categories where name='Accessories';

insert into public.products(name, description, price, category_id, image_url, stock_quantity, is_featured)
select 'Minimal Desk Lamp','Warm, focused light for your work and reading space.',42000,id,'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=900',12,false
from public.categories where name='Home & Living';

insert into public.products(name, description, price, category_id, image_url, stock_quantity, is_featured)
select 'Wireless Headphones','Comfortable everyday listening with a clean design.',67500,id,'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=900',8,true
from public.categories where name='Technology';
