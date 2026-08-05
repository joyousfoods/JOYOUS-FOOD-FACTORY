import React from 'react'
import chocolateImg from '../assets/chocolate.png'
import roseImg from '../assets/rose gulakand.png'
import kesarImg from '../assets/kesar badam.png'
import pistachioImg from '../assets/pisthachio.png'
import mangoImg from '../assets/mango fusion.png'
import vanillaImg from '../assets/venilla.png'

const flavors = [
  { name: 'Original Chocolate', color: '#1e0e05', text: '#f5e6d3', img: chocolateImg },
  { name: 'Rose Gulkand', color: '#f2c4ce', text: '#1e0e05', img: roseImg },
  { name: 'Kesar Badam', color: '#e8a020', text: '#1e0e05', img: kesarImg },
  { name: 'Pistachio Delight', color: '#8db87a', text: '#1e0e05', img: pistachioImg },
  { name: 'Mango Fusion', color: '#f5c842', text: '#1e0e05', img: mangoImg },
  { name: 'Vanilla', color: '#f5f0e8', text: '#1e0e05', img: vanillaImg },
]

const FlavorsStrip = () => {
  return (
    <section className="flavors-strip section">
      <div className="container">
        <div className="flavors-scroll-container">
          <div className="flavors-track">
            {flavors.map((flavor, index) => (
              <div key={index} className="flavor-card">
                <img src={flavor.img} alt={flavor.name} className="flavor-img" />
                <h3 className="flavor-name" style={{ color: flavor.text, backgroundColor: flavor.color }}>{flavor.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .flavors-scroll-container {
          overflow-x: auto;
          padding: 20px 0 40px;
          cursor: grab;
          scrollbar-width: none; /* Firefox */
        }

        .flavors-scroll-container::-webkit-scrollbar {
          display: none; /* Chrome/Safari */
        }

        .flavors-track {
          display: flex;
          gap: 25px;
          padding: 0 10px;
        }

        .flavor-card {
          min-width: 200px;
          height: 250px;
          border-radius: 20px;
          overflow: hidden;
          position: relative;
          box-shadow: 0 10px 30px rgba(0,0,0,0.05);
          transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
          flex-shrink: 0;
        }

        .flavor-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        }

        .flavor-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .flavor-name {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          font-family: var(--font-body);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-size: 0.9rem;
          text-align: center;
          padding: 10px;
          margin: 0;
        }

        @media (max-width: 768px) {
          .flavor-card {
            min-width: 70%; /* Shows 1.5 cards roughly */
            height: 180px;
            scroll-snap-align: center;
          }
          .flavors-track {
            scroll-snap-type: x mandatory;
            padding: 0 20px;
          }
        }
      `}</style>
    </section>
  )
}

export default FlavorsStrip
