'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogOut, Play, Pause, RotateCcw, Users, Trophy, Hash, Upload, Plus, Settings } from 'lucide-react';
import { toast } from 'sonner';

interface AdminUser {
  id: string;
  email: string;
}

interface Game {
  id: string;
  name: string;
  description: string;
  status: 'waiting' | 'active' | 'finished';
  prize_line: number;
  prize_column: number;
  prize_full: number;
  prize_image_url?: string;
  youtube_live_url?: string;
  last_number?: number;
  created_at: string;
  started_at?: string;
  finished_at?: string;
  bingo_drawn_numbers?: { number: number }[];
  bingo_participants?: unknown[];
  settings?: {
    prize_line?: number;
    prize_column?: number;
    prize_full?: number;
    prize_image_url?: string;
    youtube_live_url?: string;
    last_number?: number;
    [key: string]: unknown;
  };
}

export default function AdminDashboard() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [games, setGames] = useState<Game[]>([]);
  const [currentGame, setCurrentGame] = useState<Game | null>(null);
  const [showCreateGame, setShowCreateGame] = useState(false);
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [manualNumber, setManualNumber] = useState<string>('');
  const [isInsertingManual, setIsInsertingManual] = useState(false);
  
  // Form states
  const [gameName, setGameName] = useState('');
  const [gameDescription, setGameDescription] = useState('');
  const [prizeLine, setPrizeLine] = useState(50);
  const [prizeColumn, setPrizeColumn] = useState(100);
  const [prizeFull, setPrizeFull] = useState(500);
  const [prizeImageUrl, setPrizeImageUrl] = useState('');
  const [youtubeLiveUrl, setYoutubeLiveUrl] = useState('');

  // YouTube configuration states
  const [showYouTubeConfig, setShowYouTubeConfig] = useState(false);
  const [currentYouTubeUrl, setCurrentYouTubeUrl] = useState('');
  const [isUpdatingYouTube, setIsUpdatingYouTube] = useState(false);

  const router = useRouter();

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/me');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData.user);
      } else {
        router.push('/admin/login');
      }
    } catch (error) {
      router.push('/admin/login');
    } finally {
      setIsLoading(false);
    }
  };

  const loadGames = async () => {
    try {
      const response = await fetch('/api/admin/games');
      if (response.ok) {
        const data = await response.json();
        setGames(data.games || []);
        
        // Selecionar jogo ativo ou o mais recente
        const activeGame = data.games?.find((g: Game) => g.status === 'active');
        const latestGame = data.games?.[0];
        const selectedGame = activeGame || latestGame;
        
        console.log('🎮 Jogos carregados:', data.games?.length);
        console.log('🎯 Jogo ativo encontrado:', activeGame?.id);
        console.log('📋 Jogo selecionado:', selectedGame?.id);
        console.log('🔍 CurrentGame state antes:', currentGame?.id);
        
        if (selectedGame) {
          setCurrentGame(selectedGame);
          setDrawnNumbers(selectedGame.bingo_drawn_numbers?.map((n: { number: number }) => n.number) || []);
          console.log('✅ CurrentGame definido:', selectedGame.id);
          console.log('📺 YouTube URL do jogo:', selectedGame.youtube_live_url);
        } else {
          console.log('❌ Nenhum jogo encontrado para definir como currentGame');
        }
      }
    } catch (error) {
      console.error('Erro ao carregar jogos:', error);
      toast.error('Erro ao carregar jogos');
    }
  };

  useEffect(() => {
    checkAuth();
    loadGames();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/login', { method: 'DELETE' });
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const createGame = async () => {
    try {
      const response = await fetch('/api/admin/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: gameName || 'Novo Jogo de Bingo',
          description: gameDescription || 'Jogo criado pelo painel admin',
          prize_line: prizeLine,
          prize_column: prizeColumn,
          prize_full: prizeFull,
          prize_image_url: prizeImageUrl || null,
          youtube_live_url: youtubeLiveUrl || null
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Jogo criado com sucesso!');
        setShowCreateGame(false);
        resetForm();
        
        // Atualizar a lista de jogos e selecionar o jogo recém-criado
        await loadGames();
        
        // Definir o jogo recém-criado como o jogo atual
        if (data.game) {
          setCurrentGame(data.game);
          setDrawnNumbers([]);
          toast.info(`Jogo "${data.game.name}" selecionado como atual`);
        }
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao criar jogo');
      }
    } catch (error) {
      console.error('Erro ao criar jogo:', error);
      toast.error('Erro ao criar jogo');
    }
  };

  const startGame = async () => {
    if (!currentGame) return;
    
    try {
      const response = await fetch(`/api/admin/games/${currentGame.id}/start`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        setCurrentGame({ ...currentGame, status: 'active', started_at: new Date().toISOString() });
        loadGames();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao iniciar jogo');
      }
    } catch (error) {
      console.error('Erro ao iniciar jogo:', error);
      toast.error('Erro ao iniciar jogo');
    }
  };

  const drawNumber = async () => {
    if (!currentGame || isDrawing) return;
    
    setIsDrawing(true);
    try {
      console.log('🎲 Sorteando número para jogo:', currentGame.id);
      const response = await fetch(`/api/admin/games/${currentGame.id}/draw`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Número sorteado:', data.number, 'para jogo:', currentGame.id);
        toast.success(`Número ${data.number} sorteado!`);
        setDrawnNumbers(prev => [...prev, data.number]);
        
        // Atualizar o jogo atual com o último número sorteado
        setCurrentGame(prev => prev ? { 
          ...prev, 
          settings: {
            ...prev.settings,
            last_number: data.number
          }
        } : null);
        
        // Recarregar a lista de jogos para manter sincronizado
        loadGames();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao sortear número');
      }
    } catch (error) {
      console.error('Erro ao sortear número:', error);
      toast.error('Erro ao sortear número');
    } finally {
      setIsDrawing(false);
    }
  };

  const insertManualNumber = async () => {
    if (!currentGame || isInsertingManual || !manualNumber) return;
    
    const number = parseInt(manualNumber);
    
    // Validações
    if (isNaN(number) || number < 1 || number > 75) {
      toast.error('Por favor, insira um número válido entre 1 e 75');
      return;
    }
    
    if (drawnNumbers.includes(number)) {
      toast.error(`O número ${number} já foi sorteado anteriormente`);
      return;
    }
    
    setIsInsertingManual(true);
    try {
      const response = await fetch(`/api/admin/games/${currentGame.id}/draw-manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Número ${data.number} inserido manualmente!`);
        setDrawnNumbers(prev => [...prev, data.number]);
        setManualNumber('');
        
        // Atualizar o jogo atual com o último número inserido
        setCurrentGame(prev => prev ? { 
          ...prev, 
          settings: {
            ...prev.settings,
            last_number: data.number
          }
        } : null);
        
        // Recarregar a lista de jogos para manter sincronizado
        loadGames();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao inserir número manual');
      }
    } catch (error) {
      console.error('Erro ao inserir número manual:', error);
      toast.error('Erro ao inserir número manual');
    } finally {
      setIsInsertingManual(false);
    }
  };

  const finishGame = async () => {
    if (!currentGame) return;
    
    try {
      const response = await fetch(`/api/admin/games/${currentGame.id}/finish`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        setCurrentGame({ ...currentGame, status: 'finished', finished_at: new Date().toISOString() });
        loadGames();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao finalizar jogo');
      }
    } catch (error) {
      console.error('Erro ao finalizar jogo:', error);
      toast.error('Erro ao finalizar jogo');
    }
  };

  const resetGame = async () => {
    if (!currentGame) return;
    
    try {
      const response = await fetch(`/api/admin/games/${currentGame.id}/reset`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        setDrawnNumbers([]);
        setCurrentGame({ 
          ...currentGame, 
          status: 'waiting', 
          last_number: undefined,
          started_at: undefined,
          finished_at: undefined
        });
        loadGames();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao resetar jogo');
      }
    } catch (error) {
      console.error('Erro ao resetar jogo:', error);
      toast.error('Erro ao resetar jogo');
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setPrizeImageUrl(data.imageUrl);
        toast.success('Imagem enviada com sucesso!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao enviar imagem');
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error('Erro ao enviar imagem');
    } finally {
      setUploadingImage(false);
    }
  };

  const resetForm = () => {
    setGameName('');
    setGameDescription('');
    setPrizeLine(50);
    setPrizeColumn(100);
    setPrizeFull(500);
    setPrizeImageUrl('');
    setYoutubeLiveUrl('');
  };

  // YouTube configuration functions
  const validateYouTubeUrl = (url: string): boolean => {
    if (!url) return true; // Empty URL is valid
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)[\w-]+/;
    return youtubeRegex.test(url);
  };

  const updateYouTubeUrl = async () => {
    if (!currentGame) return;
    
    if (!validateYouTubeUrl(currentYouTubeUrl)) {
      toast.error('Por favor, insira um URL válido do YouTube');
      return;
    }

    setIsUpdatingYouTube(true);
    try {
      const response = await fetch(`/api/admin/games/${currentGame.id}/update-youtube`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ youtube_live_url: currentYouTubeUrl })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Link do YouTube atualizado com sucesso!');
        setCurrentGame({ ...currentGame, youtube_live_url: currentYouTubeUrl });
        setShowYouTubeConfig(false);
        loadGames();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao atualizar link do YouTube');
      }
    } catch (error) {
      console.error('Erro ao atualizar YouTube URL:', error);
      toast.error('Erro ao atualizar link do YouTube');
    } finally {
      setIsUpdatingYouTube(false);
    }
  };

  const openYouTubeConfig = () => {
    setCurrentYouTubeUrl(currentGame?.youtube_live_url || '');
    setShowYouTubeConfig(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-secondary/10">
      {/* Header */}
      <header className="bg-card/98 backdrop-blur-sm shadow-md border-b border-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <svg className="w-5 h-5 text-primary-foreground" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Bingo Admin Panel
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block">
                <span className="text-sm text-muted-foreground">Bem-vindo,</span>
                <span className="text-sm font-medium text-foreground ml-1">{user.email}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-2 border-border/30 hover:bg-secondary/60 hover:border-primary/50 transition-all duration-200"
              >
                <LogOut className="h-4 w-4" />
                <span>Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Action Buttons */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Dashboard</h2>
            <p className="text-muted-foreground mt-1">Gerencie seus jogos de bingo</p>
          </div>
          <Button
            onClick={() => setShowCreateGame(true)}
            className="flex items-center space-x-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <Plus className="h-4 w-4" />
            <span>Novo Jogo</span>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-border/30 bg-card/98 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-foreground">
                Status do Jogo
              </CardTitle>
              <div className={`p-2 rounded-lg ${
                currentGame?.status === 'active' ? 'bg-green-500/20 text-green-600' :
                currentGame?.status === 'waiting' ? 'bg-yellow-500/20 text-yellow-600' :
                currentGame?.status === 'finished' ? 'bg-blue-500/20 text-blue-600' :
                'bg-muted/50 text-muted-foreground'
              }`}>
                <Play className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                currentGame?.status === 'active' ? 'text-green-600' :
                currentGame?.status === 'waiting' ? 'text-yellow-600' :
                currentGame?.status === 'finished' ? 'text-blue-600' :
                'text-muted-foreground'
              }`}>
                {currentGame?.status === 'active' ? 'Ativo' : 
                 currentGame?.status === 'waiting' ? 'Aguardando' : 
                 currentGame?.status === 'finished' ? 'Finalizado' : 'Nenhum'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {currentGame?.name || 'Nenhum jogo selecionado'}
              </p>
            </CardContent>
          </Card>

          <Card 
            className="border-border/30 bg-card/98 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer"
            onClick={() => router.push('/admin/participants')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-foreground">
                Participantes
              </CardTitle>
              <div className="p-2 rounded-lg bg-blue-500/20 text-blue-600">
                <Users className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {currentGame?.bingo_participants?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Clique para gerenciar
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/30 bg-card/98 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-foreground">
                Números Sorteados
              </CardTitle>
              <div className="p-2 rounded-lg bg-purple-500/20 text-purple-600">
                <Hash className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {drawnNumbers.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                de 75 números
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/30 bg-card/98 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-foreground">
                Prêmio Principal
              </CardTitle>
              <div className="p-2 rounded-lg bg-yellow-500/20 text-yellow-600">
                <Trophy className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                R$ {currentGame?.settings?.prize_full || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Cartela completa
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Prize Display */}
        {currentGame?.settings?.prize_image_url && (
          <Card className="mb-8 border-border/30 bg-card/98 backdrop-blur-sm shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="h-5 w-5 text-yellow-600" />
                <span>Prêmio Principal</span>
              </CardTitle>
              <CardDescription>
                Imagem do prêmio que será exibida no app Android
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0">
                  <img
                    src={currentGame.settings.prize_image_url}
                    alt="Prêmio Principal"
                    className="w-48 h-48 object-cover rounded-lg shadow-md border border-border/30"
                  />
                </div>
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="text-sm text-green-700 dark:text-green-300 font-medium">Primeira Linha</div>
                      <div className="text-2xl font-bold text-green-800 dark:text-green-200">
                        R$ {currentGame.settings?.prize_line || 0}
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="text-sm text-blue-700 dark:text-blue-300 font-medium">Primeira Coluna</div>
                      <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                        R$ {currentGame.settings?.prize_column || 0}
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <div className="text-sm text-yellow-700 dark:text-yellow-300 font-medium">Cartela Completa</div>
                      <div className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">
                        R$ {currentGame.settings?.prize_full || 0}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <strong>URL da imagem:</strong> {currentGame.settings.prize_image_url}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Game Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="border-border/30 bg-card/98 backdrop-blur-sm shadow-md">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center space-x-2">
                <Settings className="h-5 w-5 text-primary" />
                <span>Controle do Jogo</span>
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Gerencie o estado atual do jogo de bingo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex space-x-2">
                <Button 
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  onClick={startGame}
                  disabled={!currentGame || currentGame.status === 'active'}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Iniciar Jogo
                </Button>
                <Button 
                  variant="outline" 
                  onClick={finishGame}
                  disabled={!currentGame || currentGame.status !== 'active'}
                  className="border-border/30 hover:bg-secondary/60"
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Finalizar
                </Button>
                <Button 
                  variant="outline" 
                  onClick={resetGame}
                  disabled={!currentGame}
                  className="border-border/30 hover:bg-secondary/60"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Resetar
                </Button>
              </div>
              <div className="text-center p-8 border-2 border-dashed border-border/30 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5">
                <div className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-3">
                  {currentGame?.settings?.last_number || '--'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {currentGame?.settings?.last_number ? 'Último número sorteado' : 'Próximo número será exibido aqui'}
                </div>
              </div>
              <Button 
                className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]" 
                size="lg" 
                onClick={drawNumber}
                disabled={!currentGame || currentGame.status !== 'active' || isDrawing}
              >
                {isDrawing ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                    <span>Sorteando...</span>
                  </div>
                ) : (
                  'Sortear Próximo Número'
                )}
              </Button>
              
              {/* Manual Number Input Section */}
              <div className="space-y-3 pt-4 border-t border-border/30">
                <Label htmlFor="manual-number" className="text-sm font-medium text-foreground">
                  Inserir Número Manualmente
                </Label>
                <div className="flex space-x-2">
                  <Input
                    id="manual-number"
                    type="number"
                    min="1"
                    max="75"
                    value={manualNumber}
                    onChange={(e) => setManualNumber(e.target.value)}
                    placeholder="1-75"
                    className="flex-1 border-border/30"
                    disabled={!currentGame || currentGame.status !== 'active' || isInsertingManual}
                  />
                  <Button 
                    onClick={insertManualNumber}
                    disabled={!currentGame || currentGame.status !== 'active' || isInsertingManual || !manualNumber}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-6"
                  >
                    {isInsertingManual ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Inserindo...</span>
                      </div>
                    ) : (
                      'Inserir'
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Insira um número de 1 a 75 que ainda não foi sorteado
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/30 bg-card/98 backdrop-blur-sm shadow-md">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center space-x-2">
                <Hash className="h-5 w-5 text-purple-600" />
                <span>Histórico de Números</span>
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Números já sorteados neste jogo
              </CardDescription>
            </CardHeader>
            <CardContent>
              {drawnNumbers.length > 0 ? (
                <div className="grid grid-cols-8 gap-2 max-h-64 overflow-y-auto p-2">
                  {drawnNumbers.map((number, index) => (
                    <div
                      key={index}
                      className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-lg flex items-center justify-center text-sm font-bold text-purple-600 hover:scale-110 transition-transform duration-200"
                    >
                      {number}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 text-muted-foreground">
                  <Hash className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>Nenhum número sorteado ainda</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* YouTube Configuration Section - SEMPRE VISÍVEL PARA DEBUG */}
        <Card className="mb-8 border-border/30 bg-card/98 backdrop-blur-sm shadow-md">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center space-x-2">
              <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              <span>Configurações do YouTube</span>
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Configure o link do YouTube para o player de vídeo no app
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!currentGame && games.length === 0 && (
              <div className="p-4 bg-gradient-to-r from-blue-50/50 to-indigo-100/50 dark:from-blue-900/20 dark:to-indigo-800/20 rounded-lg border border-blue-200/50 dark:border-blue-800/50 mb-4">
                <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                  ℹ️ Nenhum jogo encontrado
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400">
                  Crie um novo jogo usando o botão "Novo Jogo" acima para configurar o YouTube.
                </div>
              </div>
            )}
            
            {!currentGame && games.length > 0 && (
              <div className="p-4 bg-gradient-to-r from-yellow-50/50 to-orange-100/50 dark:from-yellow-900/20 dark:to-orange-800/20 rounded-lg border border-yellow-200/50 dark:border-yellow-800/50 mb-4">
                <div className="text-sm font-medium text-yellow-700 dark:text-yellow-300 mb-2">
                  ⚠️ Nenhum jogo selecionado
                </div>
                <div className="text-xs text-yellow-600 dark:text-yellow-400">
                  Selecione um jogo para configurar o YouTube. Jogos disponíveis: {games.length}
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50/50 to-red-100/50 dark:from-red-900/20 dark:to-red-800/20 rounded-lg border border-red-200/50 dark:border-red-800/50">
              <div className="flex-1">
                <div className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">
                  Link Atual do YouTube
                </div>
                <div className="text-xs text-red-600 dark:text-red-400 break-all">
                  {currentGame?.youtube_live_url || 'Nenhum link configurado'}
                </div>
                {currentGame && (
                  <div className="text-xs text-gray-500 mt-1">
                    Jogo: {currentGame.name} (ID: {currentGame.id})
                  </div>
                )}
              </div>
              <Button
                onClick={openYouTubeConfig}
                className="ml-4 bg-red-600 hover:bg-red-700 text-white"
                size="sm"
                disabled={!currentGame}
              >
                <Settings className="h-4 w-4 mr-2" />
                Configurar
              </Button>
            </div>
            
            {currentGame?.youtube_live_url && (
              <div className="text-xs text-muted-foreground">
                <strong>Nota:</strong> Este link será usado no player de vídeo do app Flutter. 
                Certifique-se de que é um link válido do YouTube.
              </div>
            )}
            
            {/* Debug info expandido */}
            <div className="text-xs text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded border space-y-1">
              <div><strong>Debug Info:</strong></div>
              <div>• currentGame: {currentGame ? `${currentGame.name} (${currentGame.id})` : 'null'}</div>
              <div>• games.length: {games.length}</div>
              <div>• games: {games.map(g => `${g.name} (${g.status})`).join(', ') || 'nenhum'}</div>
              <div>• YouTube URL: {currentGame?.youtube_live_url || 'não definido'}</div>
              <div>• Condição renderização: {(currentGame || games.length > 0) ? 'TRUE' : 'FALSE'}</div>
            </div>
          </CardContent>
        </Card>
        {showYouTubeConfig && (
          <div className="fixed inset-0 bg-gradient-to-br from-black/70 via-red-900/30 to-orange-900/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md mx-4 border-2 border-red-400/50 bg-gradient-to-br from-white/95 via-red-50/90 to-orange-50/90 backdrop-blur-lg shadow-2xl animate-in fade-in-0 zoom-in-95 duration-300 relative overflow-hidden">
              {/* Decorative background elements */}
              <div className="absolute inset-0 bg-gradient-to-br from-red-100/20 via-orange-100/20 to-yellow-100/20"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-red-300/30 to-transparent rounded-full blur-xl"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-orange-300/30 to-transparent rounded-full blur-xl"></div>
              
              <CardHeader className="text-center pb-4 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500 flex items-center justify-center mx-auto mb-4 shadow-lg transform hover:scale-105 transition-transform duration-200">
                  <svg className="w-8 h-8 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 bg-clip-text text-transparent drop-shadow-sm">
                  📺 Configurar YouTube
                </CardTitle>
                <CardDescription className="text-slate-600 font-medium">
                  Configure o link do YouTube para o player de vídeo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 relative z-10">
                <div className="space-y-3">
                  <Label htmlFor="youtubeUrl" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    🔗 URL do YouTube
                  </Label>
                  <Input
                    id="youtubeUrl"
                    value={currentYouTubeUrl}
                    onChange={(e) => setCurrentYouTubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="border-2 border-red-200/60 bg-white/80 focus:border-red-400 focus:ring-red-300/30 focus:ring-4 transition-all duration-200 text-slate-700 placeholder:text-slate-400 shadow-sm"
                  />
                  <div className="text-xs text-slate-500 space-y-1">
                    <p>• Cole aqui o link completo do YouTube</p>
                    <p>• Exemplo: https://www.youtube.com/watch?v=dQw4w9WgXcQ</p>
                    <p>• O link será usado no player de vídeo do app Flutter</p>
                  </div>
                  {currentYouTubeUrl && !validateYouTubeUrl(currentYouTubeUrl) && (
                    <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
                      ⚠️ URL inválida. Por favor, insira um link válido do YouTube.
                    </div>
                  )}
                </div>
                <div className="flex space-x-4 pt-4">
                  <Button 
                    onClick={updateYouTubeUrl}
                    disabled={isUpdatingYouTube || !currentYouTubeUrl || !validateYouTubeUrl(currentYouTubeUrl)}
                    className="flex-1 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 hover:from-red-600 hover:via-orange-600 hover:to-yellow-600 text-white font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 border-0 relative overflow-hidden"
                  >
                    {isUpdatingYouTube ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Salvando...</span>
                      </div>
                    ) : (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                        <Settings className="h-5 w-5 mr-2 relative z-10" />
                        <span className="relative z-10">💾 Salvar Configuração</span>
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowYouTubeConfig(false)}
                    disabled={isUpdatingYouTube}
                    className="flex-1 border-2 border-slate-300/60 hover:bg-gradient-to-r hover:from-slate-50 hover:to-gray-50 hover:border-slate-400 transition-all duration-200 text-slate-600 font-medium shadow-sm hover:shadow-md"
                  >
                    ❌ Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Create Game Modal */}
        {showCreateGame && (
          <div className="fixed inset-0 bg-gradient-to-br from-black/70 via-purple-900/30 to-blue-900/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md mx-4 border-2 border-gradient-to-r from-purple-400/50 via-pink-400/50 to-blue-400/50 bg-gradient-to-br from-white/95 via-purple-50/90 to-blue-50/90 backdrop-blur-lg shadow-2xl animate-in fade-in-0 zoom-in-95 duration-300 relative overflow-hidden">
              {/* Decorative background elements */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-100/20 via-pink-100/20 to-blue-100/20"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-300/30 to-transparent rounded-full blur-xl"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-300/30 to-transparent rounded-full blur-xl"></div>
              
              <CardHeader className="text-center pb-4 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 flex items-center justify-center mx-auto mb-4 shadow-lg transform hover:scale-105 transition-transform duration-200">
                  <svg className="w-8 h-8 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent drop-shadow-sm">
                  ✨ Criar Novo Jogo ✨
                </CardTitle>
                <CardDescription className="text-slate-600 font-medium">
                  Configure um novo jogo de bingo incrível
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 relative z-10">
                <div className="space-y-3">
                  <Label htmlFor="gameName" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    🎮 Nome do Jogo
                  </Label>
                  <Input
                    id="gameName"
                    value={gameName}
                    onChange={(e) => setGameName(e.target.value)}
                    placeholder="Ex: Bingo da Sorte 🍀"
                    className="border-2 border-purple-200/60 bg-white/80 focus:border-purple-400 focus:ring-purple-300/30 focus:ring-4 transition-all duration-200 text-slate-700 placeholder:text-slate-400 shadow-sm"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="gameDescription" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    📝 Descrição
                  </Label>
                  <Input
                    id="gameDescription"
                    value={gameDescription}
                    onChange={(e) => setGameDescription(e.target.value)}
                    placeholder="Descrição incrível do seu jogo"
                    className="border-2 border-blue-200/60 bg-white/80 focus:border-blue-400 focus:ring-blue-300/30 focus:ring-4 transition-all duration-200 text-slate-700 placeholder:text-slate-400 shadow-sm"
                  />
                </div>
                <div className="space-y-4">
                  <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    💰 Valores dos Prêmios (R$)
                  </Label>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="prizeLine" className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                        📏 Linha
                      </Label>
                      <Input
                        id="prizeLine"
                        type="number"
                        value={prizeLine}
                        onChange={(e) => setPrizeLine(Number(e.target.value))}
                        className="border-2 border-emerald-200/60 bg-white/80 focus:border-emerald-400 focus:ring-emerald-300/30 focus:ring-4 transition-all duration-200 text-slate-700 shadow-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="prizeColumn" className="text-xs font-medium text-orange-600 flex items-center gap-1">
                        📊 Coluna
                      </Label>
                      <Input
                        id="prizeColumn"
                        type="number"
                        value={prizeColumn}
                        onChange={(e) => setPrizeColumn(Number(e.target.value))}
                        className="border-2 border-orange-200/60 bg-white/80 focus:border-orange-400 focus:ring-orange-300/30 focus:ring-4 transition-all duration-200 text-slate-700 shadow-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="prizeFull" className="text-xs font-medium text-pink-600 flex items-center gap-1">
                        🎯 Cartela
                      </Label>
                      <Input
                        id="prizeFull"
                        type="number"
                        value={prizeFull}
                        onChange={(e) => setPrizeFull(Number(e.target.value))}
                        className="border-2 border-pink-200/60 bg-white/80 focus:border-pink-400 focus:ring-pink-300/30 focus:ring-4 transition-all duration-200 text-slate-700 shadow-sm"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <Label htmlFor="prizeImage" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    🖼️ Imagem do Prêmio
                  </Label>
                  <div className="flex space-x-3">
                    <Input
                      id="prizeImage"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="border-2 border-indigo-200/60 bg-white/80 focus:border-indigo-400 focus:ring-indigo-300/30 focus:ring-4 transition-all duration-200 text-slate-700 shadow-sm"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploadingImage}
                      className="border-2 border-indigo-300/60 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:border-indigo-400 transition-all duration-200 text-indigo-600 shadow-sm"
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                  {prizeImageUrl && (
                    <div className="mt-4 p-4 bg-gradient-to-br from-indigo-50/80 via-purple-50/60 to-pink-50/80 rounded-xl border-2 border-indigo-200/50 shadow-sm">
                      <img
                        src={prizeImageUrl}
                        alt="Preview do prêmio"
                        className="w-24 h-24 object-cover rounded-xl border-2 border-white shadow-lg ring-2 ring-indigo-200/50"
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <Label htmlFor="youtubeLiveUrl" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    📺 URL do YouTube Live
                  </Label>
                  <Input
                    id="youtubeLiveUrl"
                    value={youtubeLiveUrl}
                    onChange={(e) => setYoutubeLiveUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="border-2 border-red-200/60 bg-white/80 focus:border-red-400 focus:ring-red-300/30 focus:ring-4 transition-all duration-200 text-slate-700 placeholder:text-slate-400 shadow-sm"
                  />
                  <p className="text-xs text-slate-500">
                    Cole aqui o link do YouTube para exibir a live do sorteio no app
                  </p>
                </div>
                <div className="flex space-x-4 pt-4">
                  <Button 
                    onClick={createGame} 
                    className="flex-1 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 text-white font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 border-0 relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                    <Plus className="h-5 w-5 mr-2 relative z-10" />
                    <span className="relative z-10">✨ Criar Jogo ✨</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreateGame(false);
                      resetForm();
                    }}
                    className="flex-1 border-2 border-slate-300/60 hover:bg-gradient-to-r hover:from-slate-50 hover:to-gray-50 hover:border-slate-400 transition-all duration-200 text-slate-600 font-medium shadow-sm hover:shadow-md"
                  >
                    ❌ Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}