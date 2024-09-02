import React, { useState, useEffect } from 'react';
import { IonContent, IonPage, IonHeader, IonToolbar, IonTitle, IonList, IonItem, IonLabel, IonSelect, IonSelectOption, IonButton, IonCheckbox, IonInput, IonFooter, IonCol, IonGrid, IonRow } from '@ionic/react';

// Reemplaza estos valores con tu clave API y token de Trello
const API_KEY = '';
const TOKEN = '';

interface Board {
  id: string;
  name: string;
}

interface List {
  id: string;
  name: string;
}

interface Card {
  id: string;
  name: string;
  price: number;
}

const TrelloApp: React.FC = () => {
  const [boards, setBoards] = useState<Board[]>([]);
  const [lists, setLists] = useState<List[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<string>('');
  const [selectedList, setSelectedList] = useState<string>('');
  const [total, setTotal] = useState<number>(0);

  useEffect(() => {
    fetchBoards();
  }, []);

  useEffect(() => {
    calculateTotal();
  }, [cards]);

  const fetchBoards = async () => {
    try {
      const response = await fetch(`https://api.trello.com/1/members/me/boards?key=${API_KEY}&token=${TOKEN}`);
      const data: Board[] = await response.json();
      setBoards(data);
    } catch (error) {
      console.error('Error fetching boards:', error);
    }
  };

  const fetchLists = async (boardId: string) => {
    try {
      const response = await fetch(`https://api.trello.com/1/boards/${boardId}/lists?key=${API_KEY}&token=${TOKEN}`);
      const data: List[] = await response.json();
      setLists(data);
    } catch (error) {
      console.error('Error fetching lists:', error);
    }
  };

  const fetchCards = async (listId: string) => {
    try {
      const response = await fetch(`https://api.trello.com/1/lists/${listId}/cards?key=${API_KEY}&token=${TOKEN}`);
      const data: any[] = await response.json();
      const cardsWithPrice: Card[] = data.map(card => ({
        ...card,
        price: 0 // Inicializamos el precio en 0
      }));
      setCards(cardsWithPrice);
    } catch (error) {
      console.error('Error fetching cards:', error);
    }
  };

  const handleBoardSelect = (event: CustomEvent) => {
    const boardId = event.detail.value;
    setSelectedBoard(boardId);
    fetchLists(boardId);
  };

  const handleListSelect = (event: CustomEvent) => {
    const listId = event.detail.value;
    setSelectedList(listId);
    fetchCards(listId);
  };

  const handlePriceChange = (cardId: string, price: number) => {
    setCards(prevCards =>
      prevCards.map(card =>
        card.id === cardId ? { ...card, price } : card
      )
    );
  };

  const calculateTotal = () => {
    const sum = cards.reduce((acc, card) => acc + (card.price || 0), 0);
    setTotal(sum);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Aplicación Trello</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonList>
          <IonItem color="light">
            <IonLabel>Selecciona un tablero</IonLabel>
            <IonSelect onIonChange={handleBoardSelect}>
              {boards.map((board) => (
                <IonSelectOption key={board.id} value={board.id}>{board.name}</IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>

          {selectedBoard && (
            <IonItem color="light">
              <IonLabel>Selecciona una lista</IonLabel>
              <IonSelect onIonChange={handleListSelect}>
                {lists.map((list) => (
                  <IonSelectOption key={list.id} value={list.id}>{list.name}</IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>
          )}
        </IonList>

        {selectedList && (
          <IonList>
            <IonItem>
              <IonLabel>Tarjetas:</IonLabel>
            </IonItem>
            {cards.map((card) => (
              <IonItem key={card.id}>
              <IonGrid>
                <IonRow>
                  <IonCol size="2">
                    <IonCheckbox />
                  </IonCol>
                  <IonCol>
                    <IonLabel style={{ maxWidth: 'max-content'}}>{card.name}</IonLabel>
                  </IonCol>
                  <IonCol size="2">
                    <IonInput
                    type="number"
                    placeholder="Precio"
                    value={card.price}
                    onIonChange={e => handlePriceChange(card.id, parseFloat(e.detail.value!) || 0)}
                  />
                  </IonCol>
                </IonRow>
              </IonGrid>
              </IonItem>
            ))}
          </IonList>
        )}
      </IonContent>
      <IonFooter>
        <IonToolbar color="primary">
          <IonTitle>Total: ${total.toFixed(2)}</IonTitle>
        </IonToolbar>
      </IonFooter>
    </IonPage>
  );
};

export default TrelloApp;