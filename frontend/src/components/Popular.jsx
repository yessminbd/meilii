import React, { useContext, useEffect, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import { useLang } from '../context/LangContext';
import Item from './Item';
import Title from './Title';

const Popular = () => {
    const [popularProducts, setPopularProducts] = useState([]);
    const { products } = useContext(ShopContext);
    const { t } = useLang();

    useEffect(() => {
        const data = products.filter((item) => item.popular);
        setPopularProducts(data); 
    }, [products]);

    return (
        <section className='max-padd-container py-16 bg-primaryLight'>
            <Title title={t.trendingTitle} titlesStyles={"text-center"} />
            <div className='grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8'>
                {popularProducts.map((product) => (
                    <div key={product._id}>
                        <Item product={product} />
                    </div>   
                ))}
            </div>
        </section>
    );
};

export default Popular;
