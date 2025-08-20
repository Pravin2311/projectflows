import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Bell, 
  Palette, 
  Shield, 
  Globe, 
  Mail, 
  Clock, 
  Monitor,
  Sun,
  Moon,
  Info,
  Save,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface UserSettingsProps {
  onSave?: (settings: any) => void;
}

export function UserSettings({ onSave }: UserSettingsProps) {
  const { user } = useAuth() as { user: any };
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  // Profile Settings
  const [profileSettings, setProfileSettings] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    timezone: 'America/New_York',
    language: 'en'
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    projectUpdates: true,
    taskAssignments: true,
    dueDateReminders: true,
    teamInvitations: true,
    aiSuggestions: false,
    weeklyDigest: true,
    realTimeUpdates: true
  });

  // Appearance Settings  
  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: 'system', // 'light', 'dark', 'system'
    language: 'en',
    dateFormat: 'MM/dd/yyyy',
    timeFormat: '12h',
    compactView: false,
    showAvatars: true
  });

  // Privacy Settings
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'team', // 'public', 'team', 'private'
    showOnlineStatus: true,
    allowMentions: true,
    dataExport: false,
    analyticsOptIn: true
  });

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const allSettings = {
        profile: profileSettings,
        notifications: notificationSettings,
        appearance: appearanceSettings,
        privacy: privacySettings
      };
      
      // Save settings logic here
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      onSave?.(allSettings);
      
      toast({
        title: 'Settings Saved',
        description: 'Your preferences have been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: 'Unable to save settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <User className="h-5 w-5" />
          <span>User Settings</span>
        </CardTitle>
        <CardDescription>
          Manage your account preferences and customize your ProjectFlow experience.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center space-x-1">
              <User className="h-4 w-4" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center space-x-1">
              <Bell className="h-4 w-4" />
              <span>Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center space-x-1">
              <Palette className="h-4 w-4" />
              <span>Appearance</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center space-x-1">
              <Shield className="h-4 w-4" />
              <span>Privacy</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Settings */}
          <TabsContent value="profile" className="space-y-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={profileSettings.firstName}
                    onChange={(e) => setProfileSettings({ ...profileSettings, firstName: e.target.value })}
                    data-testid="input-first-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profileSettings.lastName}
                    onChange={(e) => setProfileSettings({ ...profileSettings, lastName: e.target.value })}
                    data-testid="input-last-name"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  value={profileSettings.email}
                  disabled
                  className="bg-gray-100 dark:bg-gray-800"
                  data-testid="input-email-readonly"
                />
                <p className="text-sm text-gray-500">Email cannot be changed for security reasons</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={profileSettings.timezone} onValueChange={(value) => setProfileSettings({ ...profileSettings, timezone: value })}>
                    <SelectTrigger data-testid="select-timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                      <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                      <SelectItem value="Europe/London">London (GMT)</SelectItem>
                      <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select value={profileSettings.language} onValueChange={(value) => setProfileSettings({ ...profileSettings, language: value })}>
                    <SelectTrigger data-testid="select-language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="ja">Japanese</SelectItem>
                      <SelectItem value="zh">Chinese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="space-y-4">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-3">Email Notifications</h3>
                <div className="space-y-3">
                  {Object.entries(notificationSettings).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="flex-1">
                        <Label className="capitalize">
                          {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        </Label>
                        <p className="text-sm text-gray-500">
                          {getNotificationDescription(key)}
                        </p>
                      </div>
                      <Switch
                        checked={value}
                        onCheckedChange={(checked) => 
                          setNotificationSettings({ ...notificationSettings, [key]: checked })
                        }
                        data-testid={`switch-${key}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Appearance Settings */}
          <TabsContent value="appearance" className="space-y-4">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-3">Theme</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'light', label: 'Light', icon: Sun },
                    { value: 'dark', label: 'Dark', icon: Moon },
                    { value: 'system', label: 'System', icon: Monitor }
                  ].map((theme) => (
                    <Button
                      key={theme.value}
                      variant={appearanceSettings.theme === theme.value ? 'default' : 'outline'}
                      className="flex items-center space-x-2 h-auto p-4"
                      onClick={() => setAppearanceSettings({ ...appearanceSettings, theme: theme.value })}
                      data-testid={`button-theme-${theme.value}`}
                    >
                      <theme.icon className="h-4 w-4" />
                      <span>{theme.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Display Options</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dateFormat">Date Format</Label>
                    <Select value={appearanceSettings.dateFormat} onValueChange={(value) => setAppearanceSettings({ ...appearanceSettings, dateFormat: value })}>
                      <SelectTrigger data-testid="select-date-format">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MM/dd/yyyy">MM/DD/YYYY</SelectItem>
                        <SelectItem value="dd/MM/yyyy">DD/MM/YYYY</SelectItem>
                        <SelectItem value="yyyy-MM-dd">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timeFormat">Time Format</Label>
                    <Select value={appearanceSettings.timeFormat} onValueChange={(value) => setAppearanceSettings({ ...appearanceSettings, timeFormat: value })}>
                      <SelectTrigger data-testid="select-time-format">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12h">12 Hour</SelectItem>
                        <SelectItem value="24h">24 Hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Compact View</Label>
                    <Switch
                      checked={appearanceSettings.compactView}
                      onCheckedChange={(checked) => setAppearanceSettings({ ...appearanceSettings, compactView: checked })}
                      data-testid="switch-compact-view"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Show Avatars</Label>
                    <Switch
                      checked={appearanceSettings.showAvatars}
                      onCheckedChange={(checked) => setAppearanceSettings({ ...appearanceSettings, showAvatars: checked })}
                      data-testid="switch-show-avatars"
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Privacy Settings */}
          <TabsContent value="privacy" className="space-y-4">
            <div className="space-y-6">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Your data is stored in your own Google Drive. These settings control how your information is shared within ProjectFlow.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Profile Visibility</Label>
                  <Select value={privacySettings.profileVisibility} onValueChange={(value) => setPrivacySettings({ ...privacySettings, profileVisibility: value })}>
                    <SelectTrigger data-testid="select-profile-visibility">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public - Visible to all users</SelectItem>
                      <SelectItem value="team">Team Only - Visible to team members</SelectItem>
                      <SelectItem value="private">Private - Visible only to you</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  {Object.entries(privacySettings).filter(([key]) => key !== 'profileVisibility').map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="flex-1">
                        <Label className="capitalize">
                          {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        </Label>
                        <p className="text-sm text-gray-500">
                          {getPrivacyDescription(key)}
                        </p>
                      </div>
                      <Switch
                        checked={value}
                        onCheckedChange={(checked) => 
                          setPrivacySettings({ ...privacySettings, [key]: checked })
                        }
                        data-testid={`switch-${key}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-6 border-t">
          <Button onClick={handleSave} disabled={isSaving} data-testid="button-save-settings">
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function getNotificationDescription(key: string): string {
  const descriptions: Record<string, string> = {
    emailNotifications: 'Enable all email notifications',
    projectUpdates: 'Get notified when projects are updated',
    taskAssignments: 'Receive emails when tasks are assigned to you',
    dueDateReminders: 'Get reminders about upcoming due dates',
    teamInvitations: 'Receive notifications for team invitations',
    aiSuggestions: 'Get AI-powered project suggestions via email',
    weeklyDigest: 'Receive weekly summary of your projects',
    realTimeUpdates: 'Get instant notifications for real-time changes'
  };
  return descriptions[key] || 'Configure this notification setting';
}

function getPrivacyDescription(key: string): string {
  const descriptions: Record<string, string> = {
    showOnlineStatus: 'Let team members see when you are online',
    allowMentions: 'Allow others to mention you in comments and tasks',
    dataExport: 'Allow exporting your data for backup purposes',
    analyticsOptIn: 'Help improve ProjectFlow by sharing anonymous usage data'
  };
  return descriptions[key] || 'Configure this privacy setting';
}