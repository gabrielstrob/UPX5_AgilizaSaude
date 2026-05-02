from app.database import SessionLocal, Base, engine
from app.models import Clinica
from geoalchemy2.elements import WKTElement

def seed_data():
    db = SessionLocal()
    
    # Verifica se já existe dados
    if db.query(Clinica).count() > 0:
        print("Banco de dados já contém clínicas.")
        db.close()
        return

    print("Inserindo clínicas de teste...")
    
    clinicas = [
        {
            "nome": "UPA Odontológica Centro",
            "endereco": "Av. Paulista, 1500 - São Paulo, SP",
            "telefone": "(11) 3232-0000",
            "aberto_24h": True,
            "horarios": {
                "segunda_a_sexta": "24 Horas",
                "sabado": "24 Horas",
                "domingo": "Apenas Urgências"
            },
            "avaliacao_media": 4.8,
            "total_avaliacoes": 124,
            "localizacao": WKTElement("POINT(-46.6560 -23.5615)", srid=4326) # Av. Paulista
        },
        {
            "nome": "Clínica Saúde Sorriso",
            "endereco": "R. Augusta, 500 - São Paulo, SP",
            "telefone": "(11) 3333-1111",
            "aberto_24h": False,
            "horarios": {
                "segunda_a_sexta": "08:00 - 18:00",
                "sabado": "08:00 - 12:00",
                "domingo": "Fechado"
            },
            "avaliacao_media": 4.5,
            "total_avaliacoes": 80,
            "localizacao": WKTElement("POINT(-46.6500 -23.5500)", srid=4326) # R. Augusta
        }
    ]

    for dados in clinicas:
        clinica = Clinica(**dados)
        db.add(clinica)
    
    db.commit()
    print("Clínicas inseridas com sucesso!")
    db.close()

if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    seed_data()
