This extension enables you to run MATLAB&reg; scripts, functions, and statements as part of your build pipeline. You also can run your MATLAB and Simulink&reg; tests, generate artifacts such as JUnit test results and Cobertura code coverage reports, and publish your results to Azure Pipelines. 

To run your pipeline using the extension, install the extension to your Azure DevOps organization. (To [install the extension](https://docs.microsoft.com/en-us/azure/devops/marketplace/install-extension?view=azure-devops&tabs=browser), press the **Get it free** button at the top of this page.) You can use the extension with self-hosted or Microsoft&reg;-hosted [agents](https://docs.microsoft.com/en-us/azure/devops/pipelines/agents/agents?view=azure-devops&tabs=browser):

- To use a self-hosted agent, you must set up a computer with MATLAB (R2013b or later) as your self-hosted agent and register the agent with Azure Pipelines.

- To use a Microsoft-hosted agent, you must include a task in your pipeline to install MATLAB on the agent. Currently, this task is available only for public projects. It does not install transformation products, such as MATLAB Coder&trade; and MATLAB Compiler&trade;.

## Usage Examples
When you author your pipeline, the extension provides you with a task to run MATLAB scripts, functions, and statements. The extension also provides a task to run MATLAB and Simulink tests. Additionally, you can specify a Microsoft-hosted agent to run your MATLAB code.

### Run MATLAB Script
Use the [Run MATLAB Command](#run-matlab-command) task to run MATLAB scripts, functions, and statements. You can use this task to flexibly customize your test run or add a MATLAB related build step to your pipeline. 

For example, in a file named `azure-pipelines.yml` in the root of your repository, author a pipeline to run the commands in a file named `myscript.m`.

```YAML
pool: myPool
steps:
  - task: RunMATLABCommand@0
    inputs:
      command: myscript
``` 

### Run Tests in MATLAB Project
Use the [Run MATLAB Tests](#run-matlab-tests) task to automatically run tests authored using the MATLAB Unit Testing Framework or Simulink Test&trade;. You can use this task to generate various test and coverage artifacts. You can then publish the artifacts to Azure Pipelines. 

For example, author a pipeline to run the tests in your [MATLAB project](https://www.mathworks.com/help/matlab/projects.html) automatically, and then generate a PDF test results report, a JUnit test results report, and a Cobertura code coverage report at specified locations on the build agent. Use tasks to publish the generated artifacts to Azure Pipelines once the tests are executed.

```YAML
pool: myPool
steps:
  - task: RunMATLABTests@0
    inputs:
      testResultsPDF: test-results/results.pdf
      testResultsJUnit: test-results/results.xml
      codeCoverageCobertura: code-coverage/coverage.xml
  - task: PublishBuildArtifacts@1
    inputs:
      pathToPublish: test-results/results.pdf
  - task: PublishTestResults@2
    condition: succeededOrFailed()
    inputs:
      testResultsFiles: test-results/results.xml
  - task: PublishCodeCoverageResults@1
    inputs:
      codeCoverageTool: Cobertura
      summaryFileLocation: code-coverage/coverage.xml
``` 

 You can access the artifacts in the pipeline summary window:

- To download the PDF test results report, follow the **published** link. 
- To view the JUnit test results report, open the **Tests** tab.
- To view the Cobertura code coverage report, open the **Code Coverage** tab.

### Specify MATLAB in Pipeline
When you use the **Run MATLAB Command** or **Run MATLAB Tests** tasks in your pipeline, the self-hosted agent uses the topmost MATLAB version on the system path. The build fails if the agent cannot find any version of MATLAB on the path.

You can prepend your desired version of MATLAB to the PATH environment variable of the agent. For example, prepend MATLAB R2021b to the path and use it to run your script.

```YAML
pool: myPool
steps:
  - powershell: Write-Host '##vso[task.prependpath]C:\Program Files\MATLAB\R2021b\bin'  # Windows agent
# - bash: echo '##vso[task.prependpath]/usr/local/MATLAB/R2021b/bin'  # Linux agent
  - task: RunMATLABCommand@0
    inputs:
      command: myscript
```

### Use MATLAB on Microsoft-Hosted Agent
Before you run MATLAB code or Simulink models on a Microsoft-hosted agent, first use the [Install MATLAB](#install-matlab) task. The task installs your specified MATLAB release (R2020a or later) on a Linux&reg; virtual machine. If you do not specify a release, the task installs the latest release of MATLAB.

For example, install MATLAB R2021a on a Microsoft-hosted agent, and then use the **Run MATLAB Command** task to run the commands in your script.

```YAML
pool:
  vmImage: ubuntu-latest
steps:
  - task: InstallMATLAB@0
    inputs:
      release: R2021a
  - task: RunMATLABCommand@0
    inputs:
      command: myscript
```

## Tasks
You can access the extension tasks and add them to your pipeline when you edit your pipeline in Azure DevOps. 

![azure](https://user-images.githubusercontent.com/48831250/81958519-1ff95880-95dc-11ea-8318-a99308107476.png)

### Run MATLAB Command
Execute a MATLAB script, function, or statement. Specify the task in your pipeline YAML using the `RunMATLABCommand` key.

Argument                  | Description    
------------------------- | --------------- 
`command`                 | (Required) Script, function, or statement to execute. If the value of `command` is the name of a MATLAB script or function, do not specify the file extension. If you specify more than one script, function, or statement, use a comma or semicolon to separate them.<br/>**Example:** `myscript`<br/>**Example:** `results = runtests, assertSuccess(results);` 

MATLAB exits with exit code 0 if the specified script, function, or statement executes successfully without error. Otherwise, MATLAB terminates with a nonzero exit code, which causes the build to fail. To ensure that the build fails in certain conditions, use the [`assert`](https://www.mathworks.com/help/matlab/ref/assert.html) or [`error`](https://www.mathworks.com/help/matlab/ref/error.html) functions.

When you use this task, all of the required files must be on the MATLAB search path.

### Run MATLAB Tests
Run the tests in a MATLAB project and generate artifacts. Specify the task in your pipeline YAML using the `RunMATLABTests` key.

By default, MATLAB includes any files in your project that have a `Test` label. If your pipeline does not use a MATLAB project, or if it uses a MATLAB release before R2019a, then MATLAB includes all tests in the root of your repository or in any of its subfolders.

The **Run MATLAB Tests** task lets you customize your test run using optional arguments. For example, you can add folders to the MATLAB search path, control which tests to run, and generate various artifacts.

Argument                  | Description    
------------------------- | ---------------
`sourceFolder`            | (Optional) Location of the folder containing source code, relative to the project root folder. The specified folder and its subfolders are added to the top of the MATLAB search path. If you specify `sourceFolder` and then generate a code coverage report, MATLAB uses only the source code in the specified folder and its subfolders to generate the report. You can specify multiple folders using a colon-separated or semicolon-separated list.<br/>**Example:** `source`<br/>**Example:** `source/folderA; source/folderB`
`selectByFolder`          | (Optional) Location of the folder used to select test suite elements, relative to the project root folder. To create a test suite, MATLAB uses only the tests in the specified folder and its subfolders. You can specify multiple folders using a colon-separated or semicolon-separated list.<br/>**Example:** `test`<br/>**Example:** `test/folderA; test/folderB`
`selectByTag`             | (Optional) Test tag used to select test suite elements. To create a test suite, MATLAB uses only the test elements with the specified tag.<br/>**Example:** `Unit`
`testResultsPDF`          | (Optional) Path to write test results report in PDF format. On macOS platforms, this argument is supported in MATLAB R2020b and later.<br/>**Example:** `test-results/results.pdf`         
`testResultsJUnit`        | (Optional) Path to write test results report in JUnit XML format.<br/>**Example:** `test-results/results.xml`
`testResultsSimulinkTest` | (Optional) Path to export Simulink Test Manager results in MLDATX format. This argument requires a Simulink Test license, and is supported in MATLAB R2019a and later.<br/>**Example:** `test-results/results.mldatx`
`codeCoverageCobertura`   | (Optional) Path to write code coverage report in Cobertura XML format.<br/>**Example:** `code-coverage/coverage.xml`
`modelCoverageCobertura`  | (Optional) Path to write model coverage report in Cobertura XML format. This argument requires a Simulink Coverage™ license, and is supported in MATLAB R2018b and later.<br/>**Example:** `model-coverage/coverage.xml`

>**Note:** To customize the pretest state of the system, you can specify startup code that automatically executes before your tests run. For information on how to specify startup or shutdown files in a MATLAB project, see [Automate Startup and Shutdown Tasks](https://www.mathworks.com/help/matlab/matlab_prog/automate-startup-and-shutdown-tasks.html). If your pipeline does not use a MATLAB project, specify the commands you want executed at startup in a `startup.m` file instead, and save the file to the root of your repository. See [`startup`](https://www.mathworks.com/help/matlab/ref/startup.html) for more information.

### Install MATLAB
Install the specified MATLAB release on a Linux agent in the cloud. Specify the task in your pipeline YAML using the `InstallMATLAB` key.

Argument                  | Description    
------------------------- | --------------- 
`release`                 | (Optional) MATLAB release to install. You can specify R2020a or a later release. If you do not specify `release`, the task installs the latest release of MATLAB.<br/>**Example:** `R2021a`


Currently, this task is available only for public projects. It does not install transformation products, such as MATLAB Coder and MATLAB Compiler.

## Contact Us
If you have any questions or suggestions, please contact MathWorks&reg; at [continuous-integration@mathworks.com](mailto:continuous-integration@mathworks.com).
