import React, { useState, useEffect } from 'react';
import { IonContent, IonPage, IonHeader, IonToolbar, IonTitle, IonList, IonItem, IonLabel, IonSelect, IonSelectOption, IonCheckbox, IonInput, IonFooter, IonCol, IonGrid, IonRow, IonToggle, IonIcon} from '@ionic/react';
import { Storage } from '@capacitor/storage';

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
  checked: boolean;
}

const TrelloApp: React.FC = () => {
  const [boards, setBoards] = useState<Board[]>([]);
  const [lists, setLists] = useState<List[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<string>('');
  const [selectedList, setSelectedList] = useState<string>('');
  const [total, setTotal] = useState<number>(0);
  const [useLocalStorage, setUseLocalStorage] = useState<boolean>(false);

  useEffect(() => {
	loadUseLocalStoragePreference();
    fetchBoards();
  }, []);

  useEffect(() => {
    calculateTotal();
  }, [cards]);

  useEffect(() => {
    if (useLocalStorage) {
      saveDataToStorage();
    } else {
      clearLocalStorage();
    }
  }, [useLocalStorage, boards, lists, cards]);

  const loadUseLocalStoragePreference = async () => {
    const { value } = await Storage.get({ key: 'useLocalStorage' });
    setUseLocalStorage(value === 'true');
  };

  const saveUseLocalStoragePreference = async (value: boolean) => {
    await Storage.set({ key: 'useLocalStorage', value: value.toString() });
    setUseLocalStorage(value);
  };

  const saveDataToStorage = async () => {
    await Storage.set({ key: 'boards', value: JSON.stringify(boards) });
    await Storage.set({ key: 'lists', value: JSON.stringify(lists) });
    await Storage.set({ key: 'cards', value: JSON.stringify(cards) });
    await Storage.set({ key: 'selectedBoard', value: selectedBoard });
    await Storage.set({ key: 'selectedList', value: selectedList });
  };

  const loadDataFromStorage = async () => {
    const boardsData = await Storage.get({ key: 'boards' });
    const listsData = await Storage.get({ key: 'lists' });
    const cardsData = await Storage.get({ key: 'cards' });
    const selectedBoardData = await Storage.get({ key: 'selectedBoard' });
    const selectedListData = await Storage.get({ key: 'selectedList' });

    if (boardsData.value) setBoards(JSON.parse(boardsData.value));
    if (listsData.value) setLists(JSON.parse(listsData.value));
    if (cardsData.value) setCards(JSON.parse(cardsData.value));
    if (selectedBoardData.value) setSelectedBoard(selectedBoardData.value);
    if (selectedListData.value) setSelectedList(selectedListData.value);
  };

  const clearLocalStorage = async () => {
    await Storage.clear();
  };

  const fetchBoards = async () => {
    if (useLocalStorage) {
      await loadDataFromStorage();
    } else {
      try {
        const response = await fetch(`https://api.trello.com/1/members/me/boards?key=${API_KEY}&token=${TOKEN}`);
        const data: Board[] = await response.json();
        setBoards(data);
      } catch (error) {
        console.error('Error fetching boards:', error);
      }
    }
  };

  const fetchLists = async (boardId: string) => {
    if (useLocalStorage) {
      // Los datos ya están cargados desde el almacenamiento local
      return;
    }
    try {
      const response = await fetch(`https://api.trello.com/1/boards/${boardId}/lists?key=${API_KEY}&token=${TOKEN}`);
      const data: List[] = await response.json();
      setLists(data);
    } catch (error) {
      console.error('Error fetching lists:', error);
    }
  };

  const fetchCards = async (listId: string) => {
    if (useLocalStorage) {
      // Los datos ya están cargados desde el almacenamiento local
      return;
    }
    try {
      const response = await fetch(`https://api.trello.com/1/lists/${listId}/cards?key=${API_KEY}&token=${TOKEN}`);
      const data: any[] = await response.json();
      const cardsWithPrice: Card[] = data.map(card => ({
        ...card,
        price: 0,
        checked: false
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

  const handleUseLocalStorageToggle = (event: CustomEvent) => {
    const isChecked = event.detail.checked;
    saveUseLocalStoragePreference(isChecked);
    if (isChecked) {
      loadDataFromStorage();
    } else {
      fetchBoards();
    }
  };

  const handleCardCheck = (cardId: string, isChecked: boolean) => {
    setCards(prevCards => {
      const updatedCards = prevCards.map(card =>
        card.id === cardId ? { ...card, checked: isChecked } : card
      );
      return sortCards(updatedCards);
    });
  };

  const sortCards = (cardsToSort: Card[]) => {
    return [...cardsToSort].sort((a, b) => {
      if (a.checked === b.checked) return 0;
      if (a.checked) return -1;
      return 1;
    });
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>TRLLApp</IonTitle>
          <IonItem color="primary" slot="end">
            <IonIcon 
              color="secondary"
              name="save"></IonIcon>
            <IonToggle 
              color="secondary"
              enableOnOffLabels={true}
              checked={useLocalStorage}
              onIonChange={handleUseLocalStorageToggle}
            />
          </IonItem>				  
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonList>
          <IonItem color="light">
            <IonLabel>Selecciona un tablero</IonLabel>
            <IonSelect onIonChange={handleBoardSelect}  value={selectedBoard}>
              {boards.map((board) => (
                <IonSelectOption key={board.id} value={board.id}>{board.name}</IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>

          {selectedBoard && (
            <IonItem color="light">
              <IonLabel>Selecciona una lista</IonLabel>
              <IonSelect onIonChange={handleListSelect} value={selectedList}>
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
              <IonGrid style={{ 
                backgroundColor: card.checked ? '#0163aa' : 'transparent', 
                color: card.checked ? '#fff' : '#000'}}>
                <IonRow>
                  <IonCol size="2">
                <IonCheckbox
                  checked={card.checked}
                  onIonChange={e => handleCardCheck(card.id, e.detail.checked)}
                />
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