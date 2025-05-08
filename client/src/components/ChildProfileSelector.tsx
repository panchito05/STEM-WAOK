import { useState } from "react";
import { useLocation } from "wouter";
import { useChildProfiles } from "@/context/ChildProfilesContext";
import { useExercise } from "@/context/ExerciseContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { PlusCircle, User, Edit, Trash2, ChevronDown, EllipsisVertical, AlertTriangle } from "lucide-react";

interface CreateProfileFormProps {
  onClose: () => void;
}

function CreateProfileForm({ onClose }: CreateProfileFormProps) {
  const { createProfile, isLoading } = useChildProfiles();
  const [name, setName] = useState("");
  const [age, setAge] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    const ageNum = age ? parseInt(age, 10) : undefined;
    await createProfile(name, ageNum);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-2">
        <div className="grid gap-2">
          <Label htmlFor="name">Nombre</Label>
          <Input
            id="name"
            placeholder="Nombre del niño/a"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="age">Edad</Label>
          <Input
            id="age"
            type="number"
            placeholder="Edad del niño/a"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            min="1"
            max="18"
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading || !name.trim()}>
          {isLoading ? "Creando..." : "Crear perfil"}
        </Button>
      </DialogFooter>
    </form>
  );
}

interface EditProfileFormProps {
  profileId: number;
  profileName: string;
  profileAge?: number | null;
  onClose: () => void;
}

function EditProfileForm({ profileId, profileName, profileAge, onClose }: EditProfileFormProps) {
  const { updateProfile, isLoading } = useChildProfiles();
  const [name, setName] = useState(profileName);
  const [age, setAge] = useState<string>(profileAge?.toString() || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    const ageNum = age ? parseInt(age, 10) : null;
    await updateProfile(profileId, { name, age: ageNum });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-2">
        <div className="grid gap-2">
          <Label htmlFor="edit-name">Nombre</Label>
          <Input
            id="edit-name"
            placeholder="Nombre del niño/a"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="edit-age">Edad</Label>
          <Input
            id="edit-age"
            type="number"
            placeholder="Edad del niño/a"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            min="1"
            max="18"
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading || !name.trim()}>
          {isLoading ? "Guardando..." : "Guardar cambios"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function ChildProfileSelector() {
  const { profiles, activeProfile, setActiveProfile, deleteProfile, isLoading } = useChildProfiles();
  const { isExerciseActive } = useExercise();
  const [, setLocation] = useLocation();
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [profileToEdit, setProfileToEdit] = useState<{ id: number; name: string; age?: number | null }>({ id: 0, name: "" });
  const [profileToDelete, setProfileToDelete] = useState<number | null>(null);
  const [profileToChange, setProfileToChange] = useState<number | null>(null);
  const [showChangeWarning, setShowChangeWarning] = useState(false);

  if (profiles.length === 0) {
    // Si no hay perfiles, mostrar solo botón para crear uno nuevo
    return (
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1">
            <PlusCircle className="h-4 w-4" />
            <span>Crear perfil</span>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear perfil</DialogTitle>
            <DialogDescription>
              Crea un perfil para tu hijo/a para personalizar su experiencia de aprendizaje.
            </DialogDescription>
          </DialogHeader>
          <CreateProfileForm onClose={() => setCreateDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Selector de perfil activo */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Avatar className="h-5 w-5">
              <AvatarImage src={activeProfile?.avatar || ""} alt={activeProfile?.name || ""} />
              <AvatarFallback>
                <User className="h-3 w-3" />
              </AvatarFallback>
            </Avatar>
            <span>{activeProfile?.name}</span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {profiles.map(profile => (
            <DropdownMenuItem
              key={profile.id}
              onClick={() => {
                // Si hay un ejercicio activo, mostrar advertencia
                if (isExerciseActive && profile.id !== activeProfile?.id) {
                  setProfileToChange(profile.id);
                  setShowChangeWarning(true);
                } else if (!isLoading && profile.id !== activeProfile?.id) {
                  // Cambiar perfil y redirigir a la página principal
                  setActiveProfile(profile.id).then(() => {
                    setLocation("/");
                  });
                }
              }}
              disabled={isLoading || profile.id === activeProfile?.id}
              className={profile.id === activeProfile?.id ? "bg-muted" : ""}
            >
              <Avatar className="h-5 w-5 mr-2">
                <AvatarImage src={profile.avatar || ""} alt={profile.name} />
                <AvatarFallback>
                  <User className="h-3 w-3" />
                </AvatarFallback>
              </Avatar>
              {profile.name} {profile.age && `(${profile.age})`}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Menú de acciones (editar, eliminar perfiles) */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <EllipsisVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => {
              if (activeProfile) {
                setProfileToEdit({
                  id: activeProfile.id,
                  name: activeProfile.name,
                  age: activeProfile.age
                });
                setEditDialogOpen(true);
              }
            }}
            disabled={!activeProfile}
            className="gap-2"
          >
            <Edit className="h-4 w-4" />
            Editar perfil
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => activeProfile && setProfileToDelete(activeProfile.id)}
            disabled={!activeProfile || profiles.length <= 1}
            className="gap-2 text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Eliminar perfil
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Botón para añadir nuevo perfil */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon" className="h-8 w-8">
            <PlusCircle className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear perfil</DialogTitle>
            <DialogDescription>
              Crea un perfil para tu hijo/a para personalizar su experiencia de aprendizaje.
            </DialogDescription>
          </DialogHeader>
          <CreateProfileForm onClose={() => setCreateDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Diálogo para editar perfil */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar perfil</DialogTitle>
            <DialogDescription>
              Modifica los datos del perfil seleccionado.
            </DialogDescription>
          </DialogHeader>
          <EditProfileForm 
            profileId={profileToEdit.id}
            profileName={profileToEdit.name}
            profileAge={profileToEdit.age}
            onClose={() => setEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación para eliminar perfil */}
      <AlertDialog open={profileToDelete !== null} onOpenChange={(open) => !open && setProfileToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar perfil?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán todos los datos asociados a este perfil.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={async () => {
                if (profileToDelete !== null) {
                  await deleteProfile(profileToDelete);
                  setProfileToDelete(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de advertencia para cambio de perfil durante ejercicio activo */}
      <AlertDialog open={showChangeWarning} onOpenChange={setShowChangeWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              Advertencia: Ejercicio en progreso
            </AlertDialogTitle>
            <AlertDialogDescription>
              Hay un ejercicio actualmente en progreso. Si cambias de perfil ahora, perderás todo el progreso 
              no guardado en el ejercicio actual.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setProfileToChange(null);
              setShowChangeWarning(false);
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={async () => {
                if (profileToChange !== null) {
                  // Cambiar perfil y redirigir a la pantalla de inicio
                  await setActiveProfile(profileToChange);
                  setProfileToChange(null);
                  setShowChangeWarning(false);
                  // Redirigir a la página principal
                  setLocation("/");
                }
              }}
              className="bg-amber-600 text-white hover:bg-amber-700"
            >
              Cambiar de perfil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}