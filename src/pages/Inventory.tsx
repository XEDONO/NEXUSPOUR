import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  IonContent,
  IonPage,
  IonIcon,
  IonCheckbox,
  IonButton,
  IonSelect,
  IonSelectOption,
  IonInput,
  IonAvatar,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonItem,
  IonLabel,
  IonRippleEffect,
  IonToast
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { pdfToLines } from '../utils/pdf';
import { parseStockPDFLines } from '../utils/pdfParsers';
import { API_BASE_URL } from '../apiConfig';
import {
  checkmarkDoneCircleOutline, 
  closeCircleOutline, 
  printOutline, 
  saveOutline, 
  pencilOutline, 
  listOutline,
  chevronBackOutline,
  chevronDownOutline,
  albumsOutline,
  cafeOutline,
  cloudUploadOutline,
  home,
  thermometerOutline,
  clipboardOutline,
  warningOutline,
  addCircleOutline,
  trashOutline,
  syncOutline
} from 'ionicons/icons';


// Type for a single inventory item from DB
type StockItem = {
  id: string;
  name: string;
  qty: number;
  unit: string;
  location: string;
  par: number;
  category: string;
  lastUpdated: string;
  lastOrderedAt?: string;
  restockCount?: number;
};

// Type for an item that has been moved to the restock list
type RestockListItem = {
  id: string;
  name: string;
  urgency: 'high' | 'medium' | 'low';
  notes: string;
};

const Inventory: React.FC = () => {
  const history = useHistory();
  const fileRef = useRef<HTMLInputElement | null>(null);
  
  // All inventory items from the database
  const [inventoryItems, setInventoryItems] = useState<StockItem[]>([]);
  // Local changes that haven't been saved yet
  const [localChanges, setLocalChanges] = useState<Set<string>>(new Set());
  // IDs of checked items in the main inventory list
  const [selectedInventoryIds, setSelectedInventoryIds] = useState<Set<string>>(new Set());
  // The items that have been moved to the restock list in Section 2
  const [restockList, setRestockList] = useState<RestockListItem[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState({ show: false, message: '', color: 'success' });
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    qty: 0,
    unit: 'units',
    location: '',
    category: '',
    par: 0,
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = () => {
    setIsLoading(true);
    fetch(`${API_BASE_URL}/inventory.php`)
        .then(res => res.json())
        .then(data => {
            setInventoryItems(data);
            setIsLoading(false);
        })
        .catch(err => {
            console.error(err);
            setIsLoading(false);
        });
  };
  
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
        const lines = await pdfToLines(file);
        const parsedItems = parseStockPDFLines(lines);
        
        const res = await fetch(`${API_BASE_URL}/inventory.php?action=bulk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(parsedItems)
        });

        const responseText = await res.text();

        if (!res.ok) {
            let errorMsg = responseText;
            try {
                const errorBody = JSON.parse(responseText);
                errorMsg = errorBody.message || responseText;
            } catch (e) {
                // Not JSON, use raw text
            }
            throw new Error(`Failed to import items: ${errorMsg}`);
        }

        const newItems = JSON.parse(responseText);
        setInventoryItems(prev => [...prev, ...newItems]);
        setShowToast({ show: true, message: `${newItems.length} items imported successfully!`, color: 'success' });

    } catch (error: any) {
        console.error('Error importing PDF:', error);
        setShowToast({ show: true, message: `Import error: ${error.message}`, color: 'danger' });
    } finally {
        if(fileRef.current) {
            fileRef.current.value = '';
        }
    }
  };

  const handleSelectionChange = (itemId: string, isChecked: boolean) => {
    const newSelection = new Set(selectedInventoryIds);
    if (isChecked) {
      newSelection.add(itemId);
    } else {
      newSelection.delete(itemId);
    }
    setSelectedInventoryIds(newSelection);
  };

  const handleQtyChange = (itemId: string, newQty: number) => {
    setInventoryItems(prev => prev.map(item => item.id === itemId ? { ...item, qty: newQty } : item));
    setLocalChanges(prev => new Set(prev).add(itemId));
  };

  const handleInventorySave = async () => {
    if (localChanges.size === 0) return;
    setIsSaving(true);
    try {
      const itemsToSave = inventoryItems.filter(item => localChanges.has(item.id));
      const savePromises = itemsToSave.map(item =>
        fetch(`${API_BASE_URL}/inventory.php?id=${item.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        })
      );

      await Promise.all(savePromises);
      setLocalChanges(new Set());
      setShowToast({ show: true, message: 'All inventory changes saved permanently.', color: 'success' });
    } catch (error) {
      console.error('Save error:', error);
      setShowToast({ show: true, message: 'Failed to save some changes.', color: 'danger' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleMoveToRestock = () => {
    const itemsToMove = inventoryItems
      .filter(item => selectedInventoryIds.has(item.id))
      .map(item => ({
        id: item.id,
        name: item.name,
        urgency: 'medium' as 'medium',
        notes: ''
      }));
    
    const existingIds = new Set(restockList.map(item => item.id));
    const filteredItemsToAdd = itemsToMove.filter(item => !existingIds.has(item.id));

    setRestockList(prev => [...prev, ...filteredItemsToAdd]);
    setSelectedInventoryIds(new Set());
  };

  const handleDeleteSelected = async () => {
    if (selectedInventoryIds.size === 0) return;

    if (!window.confirm(`Are you sure you want to permanently delete ${selectedInventoryIds.size} items?`)) {
      return;
    }

    try {
      const idsToDelete = Array.from(selectedInventoryIds);
      const deletePromises = idsToDelete.map(id =>
        fetch(`${API_BASE_URL}/inventory.php?id=${id}`, {
          method: 'DELETE'
        })
      );

      await Promise.all(deletePromises);

      setInventoryItems(prev => prev.filter(item => !selectedInventoryIds.has(item.id)));
      setLocalChanges(prev => {
        const next = new Set(prev);
        selectedInventoryIds.forEach(id => next.delete(id));
        return next;
      });
      setSelectedInventoryIds(new Set());
      setShowToast({ show: true, message: 'Items deleted permanently.', color: 'success' });
    } catch (error) {
      console.error('Delete error:', error);
      setShowToast({ show: true, message: 'Failed to delete some items.', color: 'danger' });
    }
  };

  const handleUrgencyChange = (itemId: string, urgency: 'high' | 'medium' | 'low') => {
    setRestockList(prev => prev.map(item => item.id === itemId ? { ...item, urgency } : item));
  };
  
  const handleNotesChange = (itemId: string, notes: string) => {
    setRestockList(prev => prev.map(item => item.id === itemId ? { ...item, notes } : item));
  };
  
  const handleRemoveFromRestock = (itemId: string) => {
    setRestockList(prev => prev.filter(item => item.id !== itemId));
  };

  const handleSaveRestockList = async () => {
    if (restockList.length === 0) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/restock-lists.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: restockList })
      });
      if (!res.ok) throw new Error('Failed to save list');
      
      setShowToast({ show: true, message: 'Restock list saved to history!', color: 'success' });
      setRestockList([]);
      setTimeout(() => history.push('/history'), 1000);
    } catch (error) {
      console.error(error);
      setShowToast({ show: true, message: 'Error saving restock list.', color: 'danger' });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setNewItem(prev => ({ ...prev, [name]: value }));
  };

  const handleAddItem = async () => {
    if (!newItem.name) {
      alert('Item name is required.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/inventory.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });
      if (!res.ok) throw new Error('Failed to add item');
      const addedItem = await res.json();
      setInventoryItems(prev => [addedItem, ...prev]);
      setShowAddModal(false);
      setNewItem({ name: '', qty: 0, unit: 'units', location: '', category: '', par: 0 });
      setShowToast({ show: true, message: 'New item added permanently!', color: 'success' });
    } catch (error) {
      console.error(error);
      setShowToast({ show: true, message: 'Error adding item.', color: 'danger' });
    }
  };

  return (
    <IonPage>
        <input
            type="file"
            ref={fileRef}
            style={{ display: 'none' }}
            accept=".pdf"
            onChange={handleFileImport}
        />
      <style>{`
        :root {
          --m3-surface: #FDFCF4;
          --m3-primary: #2D1B14;
          --m3-accent: #D6E8B1;
          --m3-save: #4CAF50;
        }
        .inv-page-layout {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--m3-surface);
        }
        .inv-header {
          background: var(--m3-primary);
          color: white;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.25);
          z-index: 10;
        }
        .inv-top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .inv-title-bar {
            display: flex;
            align-items: center;
            gap: 16px;
        }
        .inv-main-content {
          flex: 1;
          display: flex;
          padding: 20px;
          gap: 20px;
          overflow: hidden;
        }
        .inventory-section {
          flex: 1;
          background: white;
          border-radius: 24px;
          box-shadow: 0 8px 30px rgba(0,0,0,0.08);
          border: 1px solid #E1E3D3;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .section-header {
          padding: 16px 20px;
          border-bottom: 1px solid #E1E3D3;
          display: flex;
          align-items: center;
          gap: 8px;
          background: #FDFCF4;
        }
        .section-header h2 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 800;
          letter-spacing: 0.5px;
          color: var(--m3-primary);
          flex-grow: 1;
        }
        .item-list {
          flex-grow: 1;
          overflow-y: auto;
          padding: 8px;
        }
        .inventory-item, .restock-item {
          display: flex;
          padding: 10px 12px;
          border-bottom: 1px solid #F5F5F5;
          transition: background-color 0.2s;
        }
        .restock-item {
          flex-direction: column;
          align-items: stretch;
          padding: 16px;
          border-bottom: 1px solid #EAEAEA;
        }
        .inventory-item {
          align-items: center;
        }
        .inventory-item:hover, .restock-item:hover {
            background-color: #F8F5F2;
        }
        .inventory-item:last-child, .restock-item:last-child {
          border-bottom: none;
        }
        .inventory-item ion-checkbox {
          margin-right: 16px;
        }
        .inventory-item .item-name {
          flex-grow: 1;
          font-weight: 600;
          color: #000;
        }
        .inventory-item .qty-input {
          width: 80px;
          --padding-start: 8px;
          border: 1px solid #E1E3D3;
          border-radius: 8px;
          margin-left: 12px;
          background: white;
          --color: black;
        }
        .inventory-item.changed {
          background-color: #FFF9C4;
        }

        .restock-item .item-main-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .restock-item .item-name {
          font-weight: 700;
          font-size: 1.05rem;
          color: #000;
        }
        .restock-item .item-controls {
          display: flex;
          gap: 16px;
          align-items: flex-end;
        }
        .restock-item .control-group {
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .urgency-select {
          --padding-start: 12px;
          --padding-end: 12px;
          border: 1px solid #E1E3D3;
          background: white;
          border-radius: 8px;
          width: 100%;
          min-height: 48px;
          font-size: 0.95rem;
          --color: #000000 !important;
          color: #000000 !important;
        }
        .urgency-select::part(text) { color: #000 !important; }

        .restock-item .notes-input {
          --background: white;
          --padding-start: 12px;
          border-radius: 8px;
          border: 1px solid #E1E3D3;
          font-size: 0.95rem;
          flex: 1;
          min-height: 48px;
          --color: #000000;
          color: #000000;
        }

        .restock-item .control-group ion-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: #555;
          margin-bottom: 4px;
          text-transform: uppercase;
        }

        .section-footer {
          padding: 16px;
          border-top: 1px solid #E1E3D3;
          background: #FDFCF4;
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .btn-save-master {
          --background: #4CAF50;
          --color: white;
          --box-shadow: 0 4px 10px rgba(76, 175, 80, 0.3);
          font-weight: 800;
        }

        .m3-nav {
          position: sticky;
          bottom: 0;
          height: 75px;
          background: #FFFFFF;
          display: flex;
          border-top: 1px solid #E1E3D3;
          z-index: 1000;
          box-shadow: 0 -4px 20px rgba(0,0,0,0.05);
        }
        .nav-tab { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #A1887F; font-size: 0.75rem; font-weight: 800; cursor: pointer; text-decoration: none; }
        .nav-tab.active { color: #2D1B14; }
        .nav-indicator { width: 64px; height: 32px; border-radius: 100px; display: flex; align-items: center; justify-content: center; transition: all 0.3s; margin-bottom: 4px; }
        .nav-tab.active .nav-indicator { background: #2D1B1412; }
        
        @media (max-width: 800px) {
            .inv-main-content {
                flex-direction: column;
                padding: 12px;
                gap: 12px;
                overflow-x: hidden;
                overflow-y: auto;
            }
            .inventory-section {
                height: auto;
                min-height: 350px;
            }
        }

        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .section-footer, .edit-controls, .m3-nav, .inv-header { display: none !important; }
        }
      `}</style>
      <div className="inv-page-layout">
        <header className="inv-header">
          <div className="inv-top-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'linear-gradient(135deg, #E6BEAE 0%, #D7CCC8 100%)', width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
                  <IonIcon icon={cafeOutline} style={{ color: '#2D1B14', fontSize: '1.4rem' }} />
                </div>
                <span style={{ fontWeight: 900, fontSize: '1.4rem' }}>NexusPour</span>
              </div>
            <IonAvatar style={{ width: '40px', height: '40px', border: '2px solid rgba(255,255,255,0.2)' }}>
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Store" alt="User" />
            </IonAvatar>
          </div>
          <div className="inv-title-bar">
            <IonButton fill="clear" style={{color: 'white'}} onClick={() => history.push('/dashboard')}>
              <IonIcon icon={chevronBackOutline} />
            </IonButton>
            <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>Inventory & Restock</h1>
            <IonButton fill="outline" color="light" style={{ marginLeft: 'auto' }} onClick={() => setShowAddModal(true)}>
              <IonIcon icon={addCircleOutline} slot="start" />
              Add Item
            </IonButton>
            <IonButton fill="outline" color="light" onClick={() => fileRef.current?.click()}>
              <IonIcon icon={cloudUploadOutline} slot="start" />
              Import PDF
            </IonButton>
          </div>
        </header>

        <main className="inv-main-content">
          {/* Section 1: Full Inventory */}
          <div className="inventory-section">
            <div className="section-header">
              <IonIcon icon={listOutline} />
              <h2>Master Inventory</h2>
              <IonButton 
                color="danger"
                fill="outline"
                onClick={handleDeleteSelected}
                disabled={selectedInventoryIds.size === 0}>
                <IonIcon icon={trashOutline} slot="icon-only" />
              </IonButton>
              {localChanges.size > 0 && (
                <IonButton
                  className="btn-save-master"
                  onClick={handleInventorySave}
                  disabled={isSaving}>
                  <IonIcon icon={saveOutline} slot="start" />
                  Save {localChanges.size} Changes
                </IonButton>
              )}
              <IonButton
                onClick={handleMoveToRestock} 
                disabled={selectedInventoryIds.size === 0}>
                Add to Restock &rarr;
              </IonButton>
            </div>
            <div className="item-list">
              {isLoading ? <p style={{textAlign: 'center', padding: '20px'}}>Loading...</p> : inventoryItems.map(item => (
                <div className={`inventory-item ${localChanges.has(item.id) ? 'changed' : ''}`} key={item.id}>
                  <IonCheckbox
                    value={item.id}
                    checked={selectedInventoryIds.has(item.id)}
                    onIonChange={e => handleSelectionChange(item.id, e.detail.checked)}
                  />
                  <span className="item-name">{item.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <IonLabel style={{fontSize: '0.75rem', opacity: 0.6}}>Qty:</IonLabel>
                    <IonInput
                      type="number"
                      className="qty-input"
                      value={item.qty}
                      onIonChange={e => handleQtyChange(item.id, parseInt(e.detail.value || '0'))}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Restock List */}
          <div className="inventory-section print-area">
            <div className="section-header">
              <IonIcon icon={checkmarkDoneCircleOutline} />
              <h2>New Restock List</h2>
            </div>
            <div className="item-list">
              {restockList.length === 0 ? <p style={{textAlign: 'center', padding: '20px', color: '#888'}}>Items to restock appear here.</p> : restockList.map(item => (
                <div className="restock-item" key={item.id}>
                  <div className="item-main-info">
                    <span className="item-name">{item.name}</span>
                    <IonButton fill="clear" color="danger" size="small" onClick={() => handleRemoveFromRestock(item.id)}>
                      <IonIcon slot="icon-only" icon={closeCircleOutline} />
                    </IonButton>
                  </div>
                  <div className="item-controls">
                    <div className="control-group">
                      <IonLabel>Urgency</IonLabel>
                      <IonSelect
                        className="urgency-select"
                        value={item.urgency}
                        placeholder="Select"
                        onIonChange={e => handleUrgencyChange(item.id, e.detail.value)}
                        interface="popover"
                        toggleIcon={chevronDownOutline}
                      >
                        <IonSelectOption value="high">High</IonSelectOption>
                        <IonSelectOption value="medium">Medium</IonSelectOption>
                        <IonSelectOption value="low">Low</IonSelectOption>
                      </IonSelect>
                    </div>
                    <div className="control-group" style={{flex: 2}}>
                      <IonLabel>Notes</IonLabel>
                      <IonInput
                        className="notes-input"
                        value={item.notes}
                        onIonChange={e => handleNotesChange(item.id, e.detail.value!)}
                        placeholder="Add any details..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {restockList.length > 0 && (
              <div className="section-footer">
                <IonButton onClick={handleSaveRestockList}><IonIcon icon={saveOutline} slot="start" />Save List</IonButton>
                <IonButton onClick={handlePrint} color="medium"><IonIcon icon={printOutline} slot="start" />Print</IonButton>
              </div>
            )}
          </div>
        </main>
        
        <nav className="m3-nav">
          <div className="nav-tab" onClick={() => history.push('/dashboard')}>
            <div className="nav-indicator"><IonIcon icon={home} /></div>
            <span>Home</span>
          </div>
          <div className="nav-tab" onClick={() => history.push('/temp-check')}>
            <div className="nav-indicator"><IonIcon icon={thermometerOutline} /></div>
            <span>Temps</span>
          </div>
          <div className="nav-tab" onClick={() => history.push('/checklist')}>
            <div className="nav-indicator"><IonIcon icon={clipboardOutline} /></div>
            <span>Checks</span>
          </div>
          <div className="nav-tab active">
            <div className="nav-indicator"><IonIcon icon={albumsOutline} /></div>
            <span>Stock</span>
          </div>
          <div className="nav-tab" onClick={() => history.push('/allergens')}>
            <div className="nav-indicator"><IonIcon icon={warningOutline} /></div>
            <span>Allergens</span>
          </div>
        </nav>
      </div>

      <IonModal isOpen={showAddModal} onDidDismiss={() => setShowAddModal(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Add New Inventory Item</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowAddModal(false)}>Close</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <IonItem>
            <IonLabel position="stacked">Item Name</IonLabel>
            <IonInput name="name" value={newItem.name} onIonChange={handleInputChange} />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Quantity</IonLabel>
            <IonInput name="qty" type="number" value={newItem.qty} onIonChange={handleInputChange} />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Unit</IonLabel>
            <IonInput name="unit" value={newItem.unit} onIonChange={handleInputChange} />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Location</IonLabel>
            <IonInput name="location" value={newItem.location} onIonChange={handleInputChange} />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Category</IonLabel>
            <IonInput name="category" value={newItem.category} onIonChange={handleInputChange} />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Par Level</IonLabel>
            <IonInput name="par" type="number" value={newItem.par} onIonChange={handleInputChange} />
          </IonItem>
          <IonButton expand="block" onClick={handleAddItem} style={{ marginTop: '20px' }}>
            Add Item
          </IonButton>
        </IonContent>
      </IonModal>

      <IonToast
        isOpen={showToast.show}
        onDidDismiss={() => setShowToast({ ...showToast, show: false })}
        message={showToast.message}
        duration={3000}
        color={showToast.color}
        position="bottom"
      />
    </IonPage>
  );
};

export default Inventory;
